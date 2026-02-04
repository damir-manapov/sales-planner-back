#!/usr/bin/env bun
import 'dotenv/config';
import { SalesPlannerClient } from '@sales-planner/http-client';

interface DemoTenantArgs {
  tenantTitle?: string;
  apiUrl?: string;
}

const DEMO_SKUS = [
  { code: 'LAPTOP-001', title: 'Dell XPS 13 Laptop' },
  { code: 'LAPTOP-002', title: 'MacBook Pro 14"' },
  { code: 'LAPTOP-003', title: 'Lenovo ThinkPad X1 Carbon' },
  { code: 'PHONE-001', title: 'iPhone 15 Pro' },
  { code: 'PHONE-002', title: 'Samsung Galaxy S24' },
  { code: 'PHONE-003', title: 'Google Pixel 8 Pro' },
  { code: 'TABLET-001', title: 'iPad Pro 12.9"' },
  { code: 'TABLET-002', title: 'Samsung Galaxy Tab S9' },
  { code: 'MONITOR-001', title: 'Dell UltraSharp 27" 4K Monitor' },
  { code: 'MONITOR-002', title: 'LG UltraWide 34" Monitor' },
  { code: 'KEYBOARD-001', title: 'Logitech MX Keys Keyboard' },
  { code: 'MOUSE-001', title: 'Logitech MX Master 3S Mouse' },
  { code: 'HEADSET-001', title: 'Sony WH-1000XM5 Headphones' },
  { code: 'HEADSET-002', title: 'AirPods Pro (2nd Gen)' },
  { code: 'WEBCAM-001', title: 'Logitech Brio 4K Webcam' },
];

const DEMO_SALES_DATA = [
  // Current period (2026-01)
  { sku_code: 'LAPTOP-001', period: '2026-01', quantity: 12 },
  { sku_code: 'LAPTOP-002', period: '2026-01', quantity: 8 },
  { sku_code: 'PHONE-001', period: '2026-01', quantity: 25 },
  { sku_code: 'PHONE-002', period: '2026-01', quantity: 18 },
  { sku_code: 'TABLET-001', period: '2026-01', quantity: 10 },
  { sku_code: 'MONITOR-001', period: '2026-01', quantity: 15 },
  { sku_code: 'HEADSET-001', period: '2026-01', quantity: 20 },

  // Previous period (2025-12)
  { sku_code: 'LAPTOP-001', period: '2025-12', quantity: 15 },
  { sku_code: 'LAPTOP-002', period: '2025-12', quantity: 10 },
  { sku_code: 'PHONE-001', period: '2025-12', quantity: 30 },
  { sku_code: 'PHONE-002', period: '2025-12', quantity: 22 },
  { sku_code: 'TABLET-001', period: '2025-12', quantity: 12 },
  { sku_code: 'MONITOR-001', period: '2025-12', quantity: 18 },
  { sku_code: 'HEADSET-001', period: '2025-12', quantity: 25 },

  // Two periods ago (2025-11)
  { sku_code: 'LAPTOP-001', period: '2025-11', quantity: 10 },
  { sku_code: 'LAPTOP-002', period: '2025-11', quantity: 7 },
  { sku_code: 'PHONE-001', period: '2025-11', quantity: 20 },
  { sku_code: 'PHONE-002', period: '2025-11', quantity: 15 },
  { sku_code: 'TABLET-001', period: '2025-11', quantity: 8 },
  { sku_code: 'MONITOR-001', period: '2025-11', quantity: 12 },
  { sku_code: 'HEADSET-001', period: '2025-11', quantity: 18 },
];

interface TenantSetup {
  tenant: { id: number; title: string };
  shop: { id: number; title: string };
  user: { id: number; email: string; name: string };
  apiKey: string;
}

async function createDemoTenant(args: DemoTenantArgs) {
  const apiUrl = args.apiUrl || process.env.SALES_PLANNER_API_URL || 'http://localhost:3000';
  const systemAdminKey = process.env.SYSTEM_ADMIN_KEY;

  if (!systemAdminKey) {
    console.error('❌ Error: SYSTEM_ADMIN_KEY environment variable is required');
    process.exit(1);
  }

  const adminClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: systemAdminKey });

  const tenantTitle = args.tenantTitle || 'Demo';
  const tenantSlug = tenantTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const userEmail = `demo@${tenantSlug}.com`;
  const userName = `${tenantTitle} Admin`;

  console.log('🚀 Setting up demo tenant...');
  console.log(`   Tenant: ${tenantTitle}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log('');

  try {
    // Step 1: Check if user already exists
    console.log('🔍 Step 1: Checking if tenant already exists...');
    const users = await adminClient.getUsers();
    const existingUser = users.find((u) => u.email === userEmail);

    let setup: TenantSetup;

    if (existingUser) {
      console.log(`   ℹ️  User ${userEmail} already exists (ID: ${existingUser.id})`);

      // Get user's API key
      const apiKeys = await adminClient.getApiKeys(existingUser.id);
      const firstApiKey = apiKeys[0];
      if (!firstApiKey) {
        console.error('❌ User has no API key');
        process.exit(1);
      }

      // Get user's tenants via /me
      const userClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: firstApiKey.key });
      const me = await userClient.getMe();

      const existingTenant = me.tenants.find((t) => t.title === tenantTitle);
      const existingShop = existingTenant?.shops[0];
      if (!existingTenant || !existingShop) {
        console.error('❌ User exists but tenant/shop not found');
        process.exit(1);
      }

      setup = {
        tenant: { id: existingTenant.id, title: existingTenant.title },
        shop: { id: existingShop.id, title: existingShop.title },
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name },
        apiKey: firstApiKey.key,
      };

      console.log(`   ✅ Tenant exists: ${setup.tenant.title} (ID: ${setup.tenant.id})`);
      console.log(`   ✅ Shop exists: ${setup.shop.title} (ID: ${setup.shop.id})`);
      console.log('');
    } else {
      // Create new tenant, shop, and user
      console.log('   📦 Creating new tenant, shop, and admin user...');
      setup = await adminClient.createTenantWithShopAndUser({
        tenantTitle,
        shopTitle: 'Electronics',
        userEmail,
        userName,
      });
      console.log(`   ✅ Tenant created: ${setup.tenant.title} (ID: ${setup.tenant.id})`);
      console.log(`   ✅ Shop created: ${setup.shop.title} (ID: ${setup.shop.id})`);
      console.log(`   ✅ Admin user created: ${setup.user.name} (${setup.user.email})`);
      console.log('');
    }

    // Create client with user's API key for data operations
    const userClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: setup.apiKey });

    // Step 2: Clear existing shop data
    console.log('🧹 Step 2: Clearing existing shop data...');
    const deleteResult = await userClient.deleteShopData(setup.shop.id);
    console.log(
      `   ✅ Deleted ${deleteResult.skusDeleted} SKUs and ${deleteResult.salesHistoryDeleted} sales records`,
    );
    console.log('');

    const ctx = { shop_id: setup.shop.id, tenant_id: setup.tenant.id };

    // Step 3: Import SKUs
    console.log(`📊 Step 3: Importing ${DEMO_SKUS.length} demo products...`);
    const skusResult = await userClient.importSkusJson(DEMO_SKUS, ctx);
    console.log(`   ✅ Created ${skusResult.created} products`);
    console.log('');

    // Step 4: Import sales history
    console.log(`📈 Step 4: Importing ${DEMO_SALES_DATA.length} sales history records...`);
    const salesResult = await userClient.importSalesHistoryJson(DEMO_SALES_DATA, ctx);
    console.log(`   ✅ Created ${salesResult.created} sales records`);
    console.log('');

    // Success summary
    console.log('🎉 Demo tenant created successfully!');
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Demo Data:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`  • ${DEMO_SKUS.length} products (laptops, phones, tablets, accessories)`);
    console.log(`  • ${DEMO_SALES_DATA.length} sales history records across 3 periods`);
    console.log(`  • Periods: 2025-11, 2025-12, 2026-01`);
    console.log('');
    console.log('💡 Save the API key - it will not be shown again!');
    console.log('');

    return setup;
  } catch (error) {
    console.error('❌ Error creating demo tenant:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: bun scripts/create-demo-tenant.ts [options]

Creates a demo tenant with pre-populated data for testing and demonstrations.

Options:
  --tenant-title <title>    Custom tenant name (default: "Demo")
  --api-url <url>           API URL (default: from SALES_PLANNER_API_URL or http://localhost:3000)
  -h, --help                Show this help message

Environment Variables:
  SYSTEM_ADMIN_KEY                  System admin API key (required)
  SALES_PLANNER_API_URL             Base API URL (optional)

Demo Data Includes:
  • 15 sample products (laptops, phones, tablets, monitors, accessories)
  • Sales history for 3 months (Nov 2025, Dec 2025, Jan 2026)
  • Admin user with full access
  • Pre-configured shop

Example:
  bun scripts/create-demo-tenant.ts
  bun scripts/create-demo-tenant.ts --tenant-title "ACME Demo Corp"
  SALES_PLANNER_API_URL=https://sales-planner-back.vercel.app bun scripts/create-demo-tenant.ts
`);
  process.exit(0);
}

const tenantTitle = args.find((_arg, i) => args[i - 1] === '--tenant-title');
const apiUrl = args.find((_arg, i) => args[i - 1] === '--api-url');

createDemoTenant({ tenantTitle, apiUrl });
