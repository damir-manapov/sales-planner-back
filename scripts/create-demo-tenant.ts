#!/usr/bin/env bun
import 'dotenv/config';

interface DemoTenantArgs {
  tenantTitle?: string;
  apiUrl?: string;
}

interface TenantSetupResult {
  tenant: { id: number; title: string };
  shop: { id: number; title: string };
  user: { id: number; email: string; name: string };
  apiKey: string;
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
  { skuCode: 'LAPTOP-001', period: '2026-01', quantity: 12, revenue: 15600 },
  { skuCode: 'LAPTOP-002', period: '2026-01', quantity: 8, revenue: 19200 },
  { skuCode: 'PHONE-001', period: '2026-01', quantity: 25, revenue: 27500 },
  { skuCode: 'PHONE-002', period: '2026-01', quantity: 18, revenue: 16200 },
  { skuCode: 'TABLET-001', period: '2026-01', quantity: 10, revenue: 11000 },
  { skuCode: 'MONITOR-001', period: '2026-01', quantity: 15, revenue: 7500 },
  { skuCode: 'HEADSET-001', period: '2026-01', quantity: 20, revenue: 6000 },
  
  // Previous period (2025-12)
  { skuCode: 'LAPTOP-001', period: '2025-12', quantity: 15, revenue: 19500 },
  { skuCode: 'LAPTOP-002', period: '2025-12', quantity: 10, revenue: 24000 },
  { skuCode: 'PHONE-001', period: '2025-12', quantity: 30, revenue: 33000 },
  { skuCode: 'PHONE-002', period: '2025-12', quantity: 22, revenue: 19800 },
  { skuCode: 'TABLET-001', period: '2025-12', quantity: 12, revenue: 13200 },
  { skuCode: 'MONITOR-001', period: '2025-12', quantity: 18, revenue: 9000 },
  { skuCode: 'HEADSET-001', period: '2025-12', quantity: 25, revenue: 7500 },
  
  // Two periods ago (2025-11)
  { skuCode: 'LAPTOP-001', period: '2025-11', quantity: 10, revenue: 13000 },
  { skuCode: 'LAPTOP-002', period: '2025-11', quantity: 7, revenue: 16800 },
  { skuCode: 'PHONE-001', period: '2025-11', quantity: 20, revenue: 22000 },
  { skuCode: 'PHONE-002', period: '2025-11', quantity: 15, revenue: 13500 },
  { skuCode: 'TABLET-001', period: '2025-11', quantity: 8, revenue: 8800 },
  { skuCode: 'MONITOR-001', period: '2025-11', quantity: 12, revenue: 6000 },
  { skuCode: 'HEADSET-001', period: '2025-11', quantity: 18, revenue: 5400 },
];

async function createDemoTenant(args: DemoTenantArgs) {
  const apiUrl = args.apiUrl || process.env.SALES_PLANNER_API_URL || 'http://localhost:3000';
  const systemAdminKey = process.env.SALES_PLANNER_SYSTEM_ADMIN_KEY;

  if (!systemAdminKey) {
    console.error('❌ Error: SALES_PLANNER_SYSTEM_ADMIN_KEY environment variable is required');
    process.exit(1);
  }

  const tenantTitle = args.tenantTitle || 'Demo Electronics Store';
  const tenantSlug = tenantTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now();

  console.log('🚀 Creating demo tenant...');
  console.log(`   Tenant: ${tenantTitle}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log('');

  try {
    // Step 1: Create tenant with shop and user
    console.log('📦 Step 1: Creating tenant, shop, and admin user...');
    const setupResponse = await fetch(`${apiUrl}/tenants/with-shop-and-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': systemAdminKey,
      },
      body: JSON.stringify({
        tenantTitle,
        userEmail: `demo-${timestamp}@${tenantSlug}.com`,
        userName: `${tenantTitle} Admin`,
      }),
    });

    if (!setupResponse.ok) {
      const error = await setupResponse.text();
      console.error(`❌ Error: ${setupResponse.status} ${setupResponse.statusText}`);
      console.error(error);
      process.exit(1);
    }

    const setup: TenantSetupResult = await setupResponse.json();
    console.log(`   ✅ Tenant created: ${setup.tenant.title} (ID: ${setup.tenant.id})`);
    console.log(`   ✅ Shop created: ${setup.shop.title} (ID: ${setup.shop.id})`);
    console.log(`   ✅ Admin user created: ${setup.user.name} (${setup.user.email})`);
    console.log('');

    // Step 2: Import SKUs
    console.log(`📊 Step 2: Importing ${DEMO_SKUS.length} demo products...`);
    const skusResponse = await fetch(
      `${apiUrl}/skus/import/json?shop_id=${setup.shop.id}&tenant_id=${setup.tenant.id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': setup.apiKey,
        },
        body: JSON.stringify(DEMO_SKUS),
      },
    );

    if (!skusResponse.ok) {
      const error = await skusResponse.text();
      console.error(`❌ Error importing SKUs: ${skusResponse.status} ${skusResponse.statusText}`);
      console.error(error);
    } else {
      const skusResult = await skusResponse.json();
      console.log(`   ✅ Imported ${skusResult.created} products`);
    }
    console.log('');

    // Step 3: Get SKU IDs for sales data
    console.log('🔍 Step 3: Fetching SKU IDs...');
    const skusListResponse = await fetch(
      `${apiUrl}/skus?shop_id=${setup.shop.id}&tenant_id=${setup.tenant.id}`,
      {
        headers: {
          'x-api-key': setup.apiKey,
        },
      },
    );

    if (!skusListResponse.ok) {
      console.error('❌ Error fetching SKUs');
      process.exit(1);
    }

    const skusList: Array<{ id: number; code: string }> = await skusListResponse.json();
    const skuMap = new Map(skusList.map((sku) => [sku.code, sku.id]));
    console.log(`   ✅ Found ${skusList.length} SKUs`);
    console.log('');

    // Step 4: Create sales history records
    console.log(`📈 Step 4: Creating ${DEMO_SALES_DATA.length} sales history records...`);
    let successCount = 0;
    let errorCount = 0;

    for (const sale of DEMO_SALES_DATA) {
      const skuId = skuMap.get(sale.skuCode);
      if (!skuId) {
        console.log(`   ⚠️  Skipping ${sale.skuCode} - SKU not found`);
        errorCount++;
        continue;
      }

      const salesResponse = await fetch(
        `${apiUrl}/sales-history?shop_id=${setup.shop.id}&tenant_id=${setup.tenant.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': setup.apiKey,
          },
          body: JSON.stringify({
            sku_id: skuId,
            period: sale.period,
            quantity_sold: sale.quantity,
            revenue: sale.revenue,
          }),
        },
      );

      if (salesResponse.ok) {
        successCount++;
      } else {
        errorCount++;
        const error = await salesResponse.text();
        console.log(`   ⚠️  Error for ${sale.skuCode} ${sale.period}: ${error}`);
      }
    }

    console.log(`   ✅ Created ${successCount} sales records`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} errors`);
    }
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
    console.log(`  • ${successCount} sales history records across 3 periods`);
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
  --tenant-title <title>    Custom tenant name (default: "Demo Electronics Store")
  --api-url <url>           API URL (default: from SALES_PLANNER_API_URL or http://localhost:3000)
  -h, --help                Show this help message

Environment Variables:
  SALES_PLANNER_SYSTEM_ADMIN_KEY    System admin API key (required)
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

const tenantTitle = args.find((arg, i) => args[i - 1] === '--tenant-title');
const apiUrl = args.find((arg, i) => args[i - 1] === '--api-url');

createDemoTenant({ tenantTitle, apiUrl });
