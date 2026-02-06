import { type INestApplication } from '@nestjs/common';
import { SalesPlannerClient } from '@sales-planner/http-client';
import type {
  CreateTenantWithShopDto,
  Tenant,
  TenantWithShopAndApiKey,
  User,
} from '@sales-planner/shared';
import { cleanupUser, SYSTEM_ADMIN_KEY } from './test-helpers.js';

export interface TestContextOptions {
  tenantTitle?: string;
  shopTitle?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Test context that manages tenant, shop, and user lifecycle for e2e tests.
 * Automatically cleans up all created resources on disposal.
 */
export class TestContext {
  private _disposed = false;

  private constructor(
    private readonly app: INestApplication,
    private readonly baseUrl: string,
    public readonly tenant: Tenant,
    public readonly shop: TenantWithShopAndApiKey['shop'],
    public readonly user: TenantWithShopAndApiKey['user'],
    public readonly apiKey: string,
    public readonly client: SalesPlannerClient,
  ) {}

  /**
   * Create a new test context with tenant, shop, and user
   */
  static async create(
    app: INestApplication,
    baseUrl: string,
    options: TestContextOptions = {},
  ): Promise<TestContext> {
    const systemClient = new SalesPlannerClient({
      baseUrl,
      apiKey: SYSTEM_ADMIN_KEY,
    });

    const dto: CreateTenantWithShopDto = {
      tenantTitle: options.tenantTitle || 'Test Tenant',
      shopTitle: options.shopTitle || 'Test Shop',
      userEmail: options.userEmail || `test-${Date.now()}@example.com`,
      userName: options.userName || 'Test User',
    };

    const setup: TenantWithShopAndApiKey = await systemClient.tenants.createWithShopAndUser(dto);

    const client = new SalesPlannerClient({
      baseUrl,
      apiKey: setup.apiKey,
    });

    return new TestContext(
      app,
      baseUrl,
      setup.tenant,
      setup.shop,
      setup.user,
      setup.apiKey,
      client,
    );
  }

  /**
   * Get a system admin client for privileged operations
   */
  getSystemClient(): SalesPlannerClient {
    return new SalesPlannerClient({
      baseUrl: this.baseUrl,
      apiKey: SYSTEM_ADMIN_KEY,
    });
  }

  /**
   * Create additional user in the same tenant
   */
  async createUser(
    email: string,
    name: string,
  ): Promise<{ user: User; client: SalesPlannerClient }> {
    const systemClient = this.getSystemClient();

    // Create user
    const user = await systemClient.users.create({
      email,
      name,
      default_shop_id: this.shop.id,
    });

    // Create API key
    const apiKeyData = await systemClient.apiKeys.create({
      user_id: user.id,
      name: `Test key for ${name}`,
    });

    // Create role for the new user
    const editorRole = await systemClient.roles
      .getAll()
      .then((roles) => roles.find((r) => r.name === 'editor'));

    if (!editorRole) throw new Error('Editor role not found');

    await systemClient.userRoles.create({
      user_id: user.id,
      role_id: editorRole.id,
      tenant_id: this.tenant.id,
      shop_id: this.shop.id,
    });

    const client = new SalesPlannerClient({
      baseUrl: this.baseUrl,
      apiKey: apiKeyData.key,
    });

    return { user, client };
  }

  /**
   * Get shop context for API calls
   */
  get shopContext() {
    return {
      shop_id: this.shop.id,
      tenant_id: this.tenant.id,
    };
  }

  /**
   * Cleanup all resources created by this test context
   */
  async dispose(): Promise<void> {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    await cleanupUser(this.app, this.user.id);
  }

  /**
   * Check if context has been disposed
   */
  get isDisposed(): boolean {
    return this._disposed;
  }
}
