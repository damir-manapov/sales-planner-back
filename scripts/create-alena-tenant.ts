#!/usr/bin/env bun
import 'dotenv/config';

interface AlenaTenantArgs {
  apiUrl?: string;
}

interface TenantSetupResult {
  tenant: { id: number; title: string };
  shop: { id: number; title: string };
  user: { id: number; email: string; name: string };
  apiKey: string;
}

const ALENA_SKUS = [
  // Flowers
  { code: 'FLOWER-001', title: 'Розы красные (букет 11 шт)' },
  { code: 'FLOWER-002', title: 'Розы белые (букет 11 шт)' },
  { code: 'FLOWER-003', title: 'Тюльпаны микс (букет 15 шт)' },
  { code: 'FLOWER-004', title: 'Хризантемы кустовые' },
  { code: 'FLOWER-005', title: 'Лилии (букет 5 шт)' },
  { code: 'FLOWER-006', title: 'Герберы (букет 9 шт)' },
  { code: 'FLOWER-007', title: 'Орхидея в горшке' },
  { code: 'FLOWER-008', title: 'Пионы (букет 7 шт)' },
  { code: 'FLOWER-009', title: 'Гортензия (букет 3 шт)' },
  { code: 'FLOWER-010', title: 'Альстромерия микс' },
  // Gifts
  { code: 'GIFT-001', title: 'Плюшевый мишка 40см' },
  { code: 'GIFT-002', title: 'Коробка конфет Ferrero Rocher' },
  { code: 'GIFT-003', title: 'Открытка с поздравлением' },
  { code: 'GIFT-004', title: 'Воздушные шары (набор)' },
  { code: 'GIFT-005', title: 'Подарочная корзина' },
];

const ALENA_SALES_DATA = [
  // Current period (2026-01)
  { skuCode: 'FLOWER-001', period: '2026-01', quantity: 45 },
  { skuCode: 'FLOWER-002', period: '2026-01', quantity: 28 },
  { skuCode: 'FLOWER-003', period: '2026-01', quantity: 35 },
  { skuCode: 'FLOWER-004', period: '2026-01', quantity: 20 },
  { skuCode: 'FLOWER-005', period: '2026-01', quantity: 15 },
  { skuCode: 'GIFT-001', period: '2026-01', quantity: 12 },
  { skuCode: 'GIFT-002', period: '2026-01', quantity: 25 },

  // Previous period (2025-12) - holiday season
  { skuCode: 'FLOWER-001', period: '2025-12', quantity: 85 },
  { skuCode: 'FLOWER-002', period: '2025-12', quantity: 60 },
  { skuCode: 'FLOWER-003', period: '2025-12', quantity: 50 },
  { skuCode: 'FLOWER-004', period: '2025-12', quantity: 40 },
  { skuCode: 'FLOWER-005', period: '2025-12', quantity: 35 },
  { skuCode: 'FLOWER-008', period: '2025-12', quantity: 20 },
  { skuCode: 'GIFT-001', period: '2025-12', quantity: 30 },
  { skuCode: 'GIFT-002', period: '2025-12', quantity: 55 },
  { skuCode: 'GIFT-003', period: '2025-12', quantity: 100 },
  { skuCode: 'GIFT-004', period: '2025-12', quantity: 45 },

  // Two periods ago (2025-11)
  { skuCode: 'FLOWER-001', period: '2025-11', quantity: 38 },
  { skuCode: 'FLOWER-002', period: '2025-11', quantity: 22 },
  { skuCode: 'FLOWER-003', period: '2025-11', quantity: 25 },
  { skuCode: 'FLOWER-004', period: '2025-11', quantity: 18 },
  { skuCode: 'FLOWER-005', period: '2025-11', quantity: 12 },
  { skuCode: 'GIFT-001', period: '2025-11', quantity: 8 },
  { skuCode: 'GIFT-002', period: '2025-11', quantity: 15 },
];

async function createAlenaTenant(args: AlenaTenantArgs) {
  const apiUrl = args.apiUrl || process.env.SALES_PLANNER_API_URL || 'http://localhost:3000';
  const systemAdminKey = process.env.SALES_PLANNER_SYSTEM_ADMIN_KEY;

  if (!systemAdminKey) {
    console.error('❌ Error: SALES_PLANNER_SYSTEM_ADMIN_KEY environment variable is required');
    process.exit(1);
  }

  const tenantTitle = 'Alena Flowers';
  const shopTitle = 'Цветочный магазин';

  console.log("🌸 Creating Alena's tenant...");
  console.log(`   Tenant: ${tenantTitle}`);
  console.log(`   Shop: ${shopTitle}`);
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
        shopTitle,
        userEmail: 'alena@alena-flowers.com',
        userName: 'Алёна',
      }),
    });

    if (!setupResponse.ok) {
      const error = await setupResponse.text();
      console.error(`❌ Error: ${setupResponse.status} ${setupResponse.statusText}`);
      console.error(error);
      process.exit(1);
    }

    const setup = (await setupResponse.json()) as TenantSetupResult;
    console.log(`   ✅ Tenant created: ${setup.tenant.title} (ID: ${setup.tenant.id})`);
    console.log(`   ✅ Shop created: ${setup.shop.title} (ID: ${setup.shop.id})`);
    console.log(`   ✅ Admin user created: ${setup.user.name} (${setup.user.email})`);
    console.log('');

    // Step 2: Import SKUs
    console.log(`💐 Step 2: Importing ${ALENA_SKUS.length} products...`);
    const skusResponse = await fetch(
      `${apiUrl}/skus/import/json?shop_id=${setup.shop.id}&tenant_id=${setup.tenant.id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': setup.apiKey,
        },
        body: JSON.stringify(ALENA_SKUS),
      },
    );

    if (!skusResponse.ok) {
      const error = await skusResponse.text();
      console.error(`❌ Error importing SKUs: ${skusResponse.status} ${skusResponse.statusText}`);
      console.error(error);
    } else {
      const skusResult = (await skusResponse.json()) as { created: number };
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

    const skusList = (await skusListResponse.json()) as Array<{ id: number; code: string }>;
    const skuMap = new Map(skusList.map((sku) => [sku.code, sku.id]));
    console.log(`   ✅ Found ${skusList.length} SKUs`);
    console.log('');

    // Step 4: Create sales history records
    console.log(`📈 Step 4: Creating ${ALENA_SALES_DATA.length} sales history records...`);
    let successCount = 0;
    let errorCount = 0;

    for (const sale of ALENA_SALES_DATA) {
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
            quantity: sale.quantity,
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
    console.log("🎉 Alena's tenant created successfully!");
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
    console.log('🌸 Shop Data:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`  • ${ALENA_SKUS.length} products (flowers and gifts)`);
    console.log(`  • ${successCount} sales history records across 3 periods`);
    console.log(`  • Periods: 2025-11, 2025-12, 2026-01`);
    console.log('');
    console.log('💡 Save the API key - it will not be shown again!');
    console.log('');

    return setup;
  } catch (error) {
    console.error("❌ Error creating Alena's tenant:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: bun scripts/create-alena-tenant.ts [options]

Creates Alena's flower shop tenant with pre-populated product and sales data.

Options:
  --api-url <url>           API URL (default: from SALES_PLANNER_API_URL or http://localhost:3000)
  -h, --help                Show this help message

Environment Variables:
  SALES_PLANNER_SYSTEM_ADMIN_KEY    System admin API key (required)
  SALES_PLANNER_API_URL             Base API URL (optional)

Shop Data Includes:
  • 15 products (flowers and gifts)
  • Sales history for 3 months (Nov 2025, Dec 2025, Jan 2026)
  • Admin user: Алёна (alena@alena-flowers.com)

Example:
  bun scripts/create-alena-tenant.ts
  SALES_PLANNER_API_URL=https://sales-planner-back.vercel.app bun scripts/create-alena-tenant.ts
`);
  process.exit(0);
}

const apiUrl = args.find((_arg, i) => args[i - 1] === '--api-url');

createAlenaTenant({ apiUrl });
