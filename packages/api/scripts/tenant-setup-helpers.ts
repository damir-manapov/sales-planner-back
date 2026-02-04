import type { SalesPlannerClient } from '@sales-planner/http-client';

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

  const SalesPlannerClient = require('@sales-planner/http-client').SalesPlannerClient;
  const client = new SalesPlannerClient({ baseUrl: resolvedApiUrl, apiKey: systemAdminKey });

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

  const users = await adminClient.getUsers();
  const existingUser = users.find((u) => u.email === config.userEmail);

  if (existingUser) {
    console.log(`   ℹ️  User ${config.userEmail} already exists (ID: ${existingUser.id})`);

    // Get user's API key
    const apiKeys = await adminClient.getApiKeys(existingUser.id);
    const firstApiKey = apiKeys[0];
    if (!firstApiKey) {
      console.error('❌ User has no API key');
      process.exit(1);
    }

    // Get user's tenants via /me
    const SalesPlannerClient = require('@sales-planner/http-client').SalesPlannerClient;
    const userClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: firstApiKey.key });
    const me = await userClient.getMe();

    const existingTenant = me.tenants.find((t: { title: string }) => t.title === config.tenantTitle);
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
  const setup = await adminClient.createTenantWithShopAndUser({
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
export function printSuccessSummary(
  setup: TenantSetup,
  additionalInfo?: string[],
): void {
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
    additionalInfo.forEach((info) => console.log(`  • ${info}`));
    console.log('');
  }

  console.log('💡 Save the API key - it will not be shown again!');
  console.log('');
}
