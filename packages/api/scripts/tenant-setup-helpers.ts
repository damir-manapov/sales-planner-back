import type { SalesPlannerClient } from '../../http-client/dist/index.js';
import { SalesPlannerClient as Client, ApiError } from '../../http-client/dist/index.js';

export interface TenantSetup {
  tenant: { id: number; title: string };
  shop: { id: number; title: string };
  user: { id: number; email: string; name: string };
  apiKey: string;
}

export interface TenantSetupConfig {
  tenantTitle: string;
  shopTitle?: string;
  userEmail: string;
  userName: string;
}

/**
 * Handles errors in tenant setup scripts with consistent formatting
 */
export function handleError(step: string, error: unknown): never {
  console.error('');
  console.error(`❌ Error in ${step}:`);
  if (error instanceof ApiError) {
    console.error(`   HTTP ${error.status}: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`   ${error.message}`);
  } else {
    console.error(`   ${error}`);
  }
  process.exit(1);
}

/**
 * Executes a step with consistent logging and error handling
 */
export async function runStep<T>(
  stepNumber: number,
  emoji: string,
  description: string,
  action: () => Promise<T>,
  successMessage: (result: T) => string,
): Promise<T> {
  console.log(`${emoji} Step ${stepNumber}: ${description}...`);
  try {
    const result = await action();
    console.log(`   ✅ ${successMessage(result)}`);
    console.log('');
    return result;
  } catch (error) {
    handleError(`Step ${stepNumber}: ${description}`, error);
  }
}

/**
 * Initializes admin client and validates environment variables
 */
export function initAdminClient(apiUrl?: string): {
  client: SalesPlannerClient;
  apiUrl: string;
} {
  const resolvedApiUrl = apiUrl || process.env.SALES_PLANNER_API_URL || 'http://localhost:3000';
  const systemAdminKey = process.env.SYSTEM_ADMIN_KEY;

  if (!systemAdminKey) {
    console.error('❌ Error: SYSTEM_ADMIN_KEY environment variable is required');
    process.exit(1);
  }

  const client = new Client({ baseUrl: resolvedApiUrl, apiKey: systemAdminKey });

  return { client, apiUrl: resolvedApiUrl };
}

/**
 * Generates a URL-safe slug from a string
 */
export function createSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Checks if a tenant already exists and returns its setup, or creates a new one
 */
export async function getOrCreateTenant(
  adminClient: SalesPlannerClient,
  config: TenantSetupConfig,
  apiUrl: string,
): Promise<TenantSetup> {
  console.log('🔍 Checking if tenant already exists...');

  const usersResponse = await adminClient.users.getAll();
  // Handle both paginated (new) and array (old) responses for compatibility
  const users = Array.isArray(usersResponse) ? usersResponse : usersResponse.items;
  const existingUser = users.find((u: { email: string }) => u.email === config.userEmail);

  if (existingUser) {
    console.log(`   ℹ️  User ${config.userEmail} already exists (ID: ${existingUser.id})`);

    // Get user's API key
    const apiKeysResponse = await adminClient.apiKeys.getAll({ user_id: existingUser.id });
    // Handle both paginated (new) and array (old) responses for compatibility
    const apiKeys = Array.isArray(apiKeysResponse) ? apiKeysResponse : apiKeysResponse.items;
    const firstApiKey = apiKeys[0];
    if (!firstApiKey) {
      console.error('❌ User has no API key');
      process.exit(1);
    }

    // Get user's tenants via /me
    const userClient = new Client({ baseUrl: apiUrl, apiKey: firstApiKey.key });
    const me = await userClient.me.getMe();

    const existingTenant = me.tenants.find(
      (t: { title: string }) => t.title === config.tenantTitle,
    );
    const existingShop = existingTenant?.shops[0];

    if (!existingTenant || !existingShop) {
      console.error('❌ User exists but tenant/shop not found');
      process.exit(1);
    }

    const setup: TenantSetup = {
      tenant: { id: existingTenant.id, title: existingTenant.title },
      shop: { id: existingShop.id, title: existingShop.title },
      user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
      apiKey: firstApiKey.key,
    };

    console.log(`   ✅ Tenant exists: ${setup.tenant.title} (ID: ${setup.tenant.id})`);
    console.log(`   ✅ Shop exists: ${setup.shop.title} (ID: ${setup.shop.id})`);
    console.log('');

    return setup;
  }

  // Create new tenant, shop, and user
  console.log('   📦 Creating new tenant, shop, and admin user...');
  const setup = await adminClient.tenants.createWithShopAndUser({
    tenantTitle: config.tenantTitle,
    shopTitle: config.shopTitle,
    userEmail: config.userEmail,
    userName: config.userName,
  });

  console.log(`   ✅ Tenant created: ${setup.tenant.title} (ID: ${setup.tenant.id})`);
  console.log(`   ✅ Shop created: ${setup.shop.title} (ID: ${setup.shop.id})`);
  console.log(`   ✅ Admin user created: ${setup.user.name} (${setup.user.email})`);
  console.log('');

  return setup;
}

/**
 * Prints a formatted success summary
 */
export function printSuccessSummary(setup: TenantSetup, additionalInfo?: string[]): void {
  console.log('🎉 Setup complete!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Access Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`  Tenant:    ${setup.tenant.title} (ID: ${setup.tenant.id})`);
  console.log(`  Shop:      ${setup.shop.title} (ID: ${setup.shop.id})`);
  console.log(`  Admin:     ${setup.user.name}`);
  console.log(`  Email:     ${setup.user.email}`);
  console.log('');
  console.log(`  🔑 API Key: ${setup.apiKey}`);
  console.log('');

  if (additionalInfo && additionalInfo.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Data Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    for (const info of additionalInfo) {
      console.log(`  • ${info}`);
    }
    console.log('');
  }

  console.log('💡 Save the API key - it will not be shown again!');
  console.log('');
}
