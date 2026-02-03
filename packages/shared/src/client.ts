import type {
  ApiKey,
  Marketplace,
  Role,
  SalesHistory,
  Shop,
  Sku,
  Tenant,
  User,
} from './entities.js';
import type {
  CreateApiKeyDto,
  CreateRoleDto,
  CreateSalesHistoryDto,
  CreateShopDto,
  CreateSkuDto,
  CreateTenantDto,
  CreateTenantWithShopDto,
  CreateUserDto,
  CreateUserRoleDto,
  ImportSalesHistoryItem,
  ImportSkuItem,
  UpdateSalesHistoryDto,
  UpdateSkuDto,
} from './dto.js';
import type {
  DeleteDataResult,
  ImportResult,
  SalesHistoryExportItem,
  SkuExportItem,
  TenantWithShopAndApiKey,
  UserWithRolesAndTenants,
} from './responses.js';
import type { PeriodQuery, ShopContextParams } from './query.js';

export interface ClientConfig {
  baseUrl: string;
  apiKey: string;
}

export class SalesPlannerClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | undefined>;
    },
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // ============================================================
  // Me
  // ============================================================

  async getMe(): Promise<UserWithRolesAndTenants> {
    return this.request('GET', '/me');
  }

  // ============================================================
  // Users
  // ============================================================

  async getUsers(): Promise<User[]> {
    return this.request('GET', '/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request('GET', `/users/${id}`);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.request('POST', '/users', { body: dto });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request('DELETE', `/users/${id}`);
  }

  // ============================================================
  // Tenants
  // ============================================================

  async getTenants(): Promise<Tenant[]> {
    return this.request('GET', '/tenants');
  }

  async getTenant(id: number): Promise<Tenant> {
    return this.request('GET', `/tenants/${id}`);
  }

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    return this.request('POST', '/tenants', { body: dto });
  }

  async createTenantWithShopAndUser(dto: CreateTenantWithShopDto): Promise<TenantWithShopAndApiKey> {
    return this.request('POST', '/tenants/with-shop-and-user', { body: dto });
  }

  async updateTenant(id: number, dto: Partial<CreateTenantDto>): Promise<Tenant> {
    return this.request('PUT', `/tenants/${id}`, { body: dto });
  }

  async deleteTenant(id: number): Promise<void> {
    return this.request('DELETE', `/tenants/${id}`);
  }

  // ============================================================
  // Shops
  // ============================================================

  async getShops(tenantId?: number): Promise<Shop[]> {
    return this.request('GET', '/shops', { params: { tenantId } });
  }

  async getShop(id: number): Promise<Shop> {
    return this.request('GET', `/shops/${id}`);
  }

  async createShop(dto: CreateShopDto): Promise<Shop> {
    return this.request('POST', '/shops', { body: dto });
  }

  async updateShop(id: number, dto: Partial<CreateShopDto>): Promise<Shop> {
    return this.request('PUT', `/shops/${id}`, { body: dto });
  }

  async deleteShop(id: number): Promise<void> {
    return this.request('DELETE', `/shops/${id}`);
  }

  async deleteShopData(id: number): Promise<DeleteDataResult> {
    return this.request('DELETE', `/shops/${id}/data`);
  }

  // ============================================================
  // SKUs
  // ============================================================

  async getSkus(ctx: ShopContextParams): Promise<Sku[]> {
    return this.request('GET', '/skus', { params: ctx });
  }

  async getSku(id: number, ctx: ShopContextParams): Promise<Sku> {
    return this.request('GET', `/skus/${id}`, { params: ctx });
  }

  async createSku(dto: Omit<CreateSkuDto, 'shop_id' | 'tenant_id'>, ctx: ShopContextParams): Promise<Sku> {
    return this.request('POST', '/skus', { body: dto, params: ctx });
  }

  async updateSku(id: number, dto: UpdateSkuDto, ctx: ShopContextParams): Promise<Sku> {
    return this.request('PUT', `/skus/${id}`, { body: dto, params: ctx });
  }

  async deleteSku(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/skus/${id}`, { params: ctx });
  }

  async importSkusJson(items: ImportSkuItem[], ctx: ShopContextParams): Promise<ImportResult> {
    return this.request('POST', '/skus/import/json', { body: items, params: ctx });
  }

  async exportSkusJson(ctx: ShopContextParams): Promise<SkuExportItem[]> {
    return this.request('GET', '/skus/export/json', { params: ctx });
  }

  // ============================================================
  // Sales History
  // ============================================================

  async getSalesHistory(ctx: ShopContextParams, query?: PeriodQuery): Promise<SalesHistory[]> {
    return this.request('GET', '/sales-history', { params: { ...ctx, ...query } });
  }

  async getSalesHistoryItem(id: number, ctx: ShopContextParams): Promise<SalesHistory> {
    return this.request('GET', `/sales-history/${id}`, { params: ctx });
  }

  async createSalesHistory(
    dto: Omit<CreateSalesHistoryDto, 'shop_id' | 'tenant_id'>,
    ctx: ShopContextParams,
  ): Promise<SalesHistory> {
    return this.request('POST', '/sales-history', { body: dto, params: ctx });
  }

  async updateSalesHistory(
    id: number,
    dto: UpdateSalesHistoryDto,
    ctx: ShopContextParams,
  ): Promise<SalesHistory> {
    return this.request('PUT', `/sales-history/${id}`, { body: dto, params: ctx });
  }

  async deleteSalesHistory(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/sales-history/${id}`, { params: ctx });
  }

  async importSalesHistoryJson(
    items: ImportSalesHistoryItem[],
    ctx: ShopContextParams,
  ): Promise<ImportResult> {
    return this.request('POST', '/sales-history/import/json', { body: items, params: ctx });
  }

  async exportSalesHistoryJson(
    ctx: ShopContextParams,
    query?: PeriodQuery,
  ): Promise<SalesHistoryExportItem[]> {
    return this.request('GET', '/sales-history/export/json', { params: { ...ctx, ...query } });
  }

  // ============================================================
  // Roles
  // ============================================================

  async getRoles(): Promise<Role[]> {
    return this.request('GET', '/roles');
  }

  async getRole(id: number): Promise<Role> {
    return this.request('GET', `/roles/${id}`);
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.request('POST', '/roles', { body: dto });
  }

  async deleteRole(id: number): Promise<void> {
    return this.request('DELETE', `/roles/${id}`);
  }

  // ============================================================
  // User Roles
  // ============================================================

  async createUserRole(dto: CreateUserRoleDto): Promise<void> {
    return this.request('POST', '/user-roles', { body: dto });
  }

  async deleteUserRole(id: number): Promise<void> {
    return this.request('DELETE', `/user-roles/${id}`);
  }

  // ============================================================
  // API Keys
  // ============================================================

  async getApiKeys(): Promise<ApiKey[]> {
    return this.request('GET', '/api-keys');
  }

  async createApiKey(dto: CreateApiKeyDto): Promise<ApiKey> {
    return this.request('POST', '/api-keys', { body: dto });
  }

  async deleteApiKey(id: number): Promise<void> {
    return this.request('DELETE', `/api-keys/${id}`);
  }

  // ============================================================
  // Marketplaces
  // ============================================================

  async getMarketplaces(): Promise<Marketplace[]> {
    return this.request('GET', '/marketplaces');
  }

  async getMarketplace(id: string): Promise<Marketplace> {
    return this.request('GET', `/marketplaces/${id}`);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
