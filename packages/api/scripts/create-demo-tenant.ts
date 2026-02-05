#!/usr/bin/env bun
import 'dotenv/config';
import { SalesPlannerClient } from '../../http-client/dist/index.js';
import {
  createSlug,
  getOrCreateTenant,
  initAdminClient,
  printSuccessSummary,
} from './tenant-setup-helpers.js';

interface DemoTenantArgs {
  tenantTitle?: string;
  apiUrl?: string;
}

const DEMO_BRANDS = [
  { code: 'dell', title: 'Dell' },
  { code: 'apple', title: 'Apple' },
  { code: 'lenovo', title: 'Lenovo' },
  { code: 'samsung', title: 'Samsung' },
  { code: 'google', title: 'Google' },
  { code: 'lg', title: 'LG' },
  { code: 'logitech', title: 'Logitech' },
  { code: 'sony', title: 'Sony' },
];

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
  { sku: 'LAPTOP-001', period: '2026-01', quantity: 12, marketplace: 'WB' },
  { sku: 'LAPTOP-002', period: '2026-01', quantity: 8, marketplace: 'WB' },
  { sku: 'PHONE-001', period: '2026-01', quantity: 25, marketplace: 'OZON' },
  { sku: 'PHONE-002', period: '2026-01', quantity: 18, marketplace: 'OZON' },
  { sku: 'TABLET-001', period: '2026-01', quantity: 10, marketplace: 'WB' },
  { sku: 'MONITOR-001', period: '2026-01', quantity: 15, marketplace: 'WB' },
  { sku: 'HEADSET-001', period: '2026-01', quantity: 20, marketplace: 'OZON' },

  // Previous period (2025-12)
  { sku: 'LAPTOP-001', period: '2025-12', quantity: 15, marketplace: 'WB' },
  { sku: 'LAPTOP-002', period: '2025-12', quantity: 10, marketplace: 'WB' },
  { sku: 'PHONE-001', period: '2025-12', quantity: 30, marketplace: 'OZON' },
  { sku: 'PHONE-002', period: '2025-12', quantity: 22, marketplace: 'OZON' },
  { sku: 'TABLET-001', period: '2025-12', quantity: 12, marketplace: 'WB' },
  { sku: 'MONITOR-001', period: '2025-12', quantity: 18, marketplace: 'WB' },
  { sku: 'HEADSET-001', period: '2025-12', quantity: 25, marketplace: 'OZON' },

  // Two periods ago (2025-11)
  { sku: 'LAPTOP-001', period: '2025-11', quantity: 10, marketplace: 'WB' },
  { sku: 'LAPTOP-002', period: '2025-11', quantity: 7, marketplace: 'WB' },
  { sku: 'PHONE-001', period: '2025-11', quantity: 20, marketplace: 'OZON' },
  { sku: 'PHONE-002', period: '2025-11', quantity: 15, marketplace: 'OZON' },
  { sku: 'TABLET-001', period: '2025-11', quantity: 8, marketplace: 'WB' },
  { sku: 'MONITOR-001', period: '2025-11', quantity: 12, marketplace: 'WB' },
  { sku: 'HEADSET-001', period: '2025-11', quantity: 18, marketplace: 'OZON' },
];

async function createDemoTenant(args: DemoTenantArgs) {
  const { client: adminClient, apiUrl } = initAdminClient(args.apiUrl);

  const tenantTitle = args.tenantTitle || 'Demo';
  const tenantSlug = createSlug(tenantTitle);
  const userEmail = `demo@${tenantSlug}.com`;
  const userName = `${tenantTitle} Admin`;

  console.log('🚀 Setting up demo tenant...');
  console.log(`   Tenant: ${tenantTitle}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log('');

  try {
    // Step 1: Get or create tenant
    const setup = await getOrCreateTenant(
      adminClient,
      { tenantTitle, shopTitle: 'Electronics', userEmail, userName },
      apiUrl,
    );

    // Create client with user's API key for data operations
    const userClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: setup.apiKey });

    // Step 2: Clear existing shop data
    console.log('🧹 Step 2: Clearing existing shop data...');
    const deleteResult = await userClient.shops.deleteShopData(setup.shop.id);
    console.log(
      `   ✅ Deleted ${deleteResult.skusDeleted} SKUs and ${deleteResult.salesHistoryDeleted} sales records`,
    );
    console.log('');

    const ctx = { shop_id: setup.shop.id, tenant_id: setup.tenant.id };

    // Step 3: Import brands
    console.log(`🏷️  Step 3: Importing ${DEMO_BRANDS.length} brands...`);
    const brandsResult = await userClient.brands.importJson(ctx, DEMO_BRANDS);
    console.log(`   ✅ Created ${brandsResult.created} brands`);
    console.log('');

    // Step 5: Import sales history
    console.log(`📈 Step 5: Importing ${DEMO_SALES_DATA.length} sales history records...`);
    const salesResult = await userClient.salesHistory.importJson(ctx, DEMO_SALES_DATA);
    console.log(`   ✅ Created ${salesResult.created} sales records`);
    console.log('');

    // Success summary
    printSuccessSummary(setup, [
      `${DEMO_BRANDS.length} brands (Dell, Apple, Samsung, etc.)`,
      `${DEMO_SKUS.length} products (laptops, phones, tablets, accessories)`,
      `${DEMO_SALES_DATA.length} sales history records across 3 periods`,
      'Periods: 2025-11, 2025-12, 2026-01',
    ]);

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

Demo8 popular brands (Dell, Apple, Samsung, Lenovo, Google, LG, Logitech, Sony)
  •  Data Includes:
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
