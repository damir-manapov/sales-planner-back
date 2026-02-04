#!/usr/bin/env bun
import 'dotenv/config';
import { SalesPlannerClient } from '@sales-planner/http-client';

interface AlenaTenantArgs {
  apiUrl?: string;
}

interface TenantSetup {
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
  { sku_code: 'FLOWER-001', period: '2026-01', quantity: 45 },
  { sku_code: 'FLOWER-002', period: '2026-01', quantity: 28 },
  { sku_code: 'FLOWER-003', period: '2026-01', quantity: 35 },
  { sku_code: 'FLOWER-004', period: '2026-01', quantity: 20 },
  { sku_code: 'FLOWER-005', period: '2026-01', quantity: 15 },
  { sku_code: 'GIFT-001', period: '2026-01', quantity: 12 },
  { sku_code: 'GIFT-002', period: '2026-01', quantity: 25 },

  // Previous period (2025-12) - holiday season
  { sku_code: 'FLOWER-001', period: '2025-12', quantity: 85 },
  { sku_code: 'FLOWER-002', period: '2025-12', quantity: 60 },
  { sku_code: 'FLOWER-003', period: '2025-12', quantity: 50 },
  { sku_code: 'FLOWER-004', period: '2025-12', quantity: 40 },
  { sku_code: 'FLOWER-005', period: '2025-12', quantity: 35 },
  { sku_code: 'FLOWER-008', period: '2025-12', quantity: 20 },
  { sku_code: 'GIFT-001', period: '2025-12', quantity: 30 },
  { sku_code: 'GIFT-002', period: '2025-12', quantity: 55 },
  { sku_code: 'GIFT-003', period: '2025-12', quantity: 100 },
  { sku_code: 'GIFT-004', period: '2025-12', quantity: 45 },

  // Two periods ago (2025-11)
  { sku_code: 'FLOWER-001', period: '2025-11', quantity: 38 },
  { sku_code: 'FLOWER-002', period: '2025-11', quantity: 22 },
  { sku_code: 'FLOWER-003', period: '2025-11', quantity: 25 },
  { sku_code: 'FLOWER-004', period: '2025-11', quantity: 18 },
  { sku_code: 'FLOWER-005', period: '2025-11', quantity: 12 },
  { sku_code: 'GIFT-001', period: '2025-11', quantity: 8 },
  { sku_code: 'GIFT-002', period: '2025-11', quantity: 15 },
];

async function createAlenaTenant(args: AlenaTenantArgs) {
  const apiUrl = args.apiUrl || process.env.SALES_PLANNER_API_URL || 'http://localhost:3000';
  const systemAdminKey = process.env.SALES_PLANNER_SYSTEM_ADMIN_KEY;

  if (!systemAdminKey) {
    console.error('❌ Error: SALES_PLANNER_SYSTEM_ADMIN_KEY environment variable is required');
    process.exit(1);
  }

  const adminClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: systemAdminKey });

  const tenantTitle = 'Alena Flowers';
  const shopTitle = 'Цветочный магазин';
  const userEmail = 'alena@alena-flowers.com';
  const userName = 'Алёна';

  console.log("🌸 Setting up Alena's tenant...");
  console.log(`   Tenant: ${tenantTitle}`);
  console.log(`   Shop: ${shopTitle}`);
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
        shopTitle,
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
    const ctx = { shop_id: setup.shop.id, tenant_id: setup.tenant.id };

    // Step 2: Import SKUs (uses upsert - safe to run multiple times)
    console.log(`💐 Step 2: Importing ${ALENA_SKUS.length} products...`);
    const skusResult = await userClient.importSkusJson(ALENA_SKUS, ctx);
    if (skusResult.created > 0) {
      console.log(`   ✅ Created ${skusResult.created} new products`);
    }
    if (skusResult.updated > 0) {
      console.log(`   ✅ Updated ${skusResult.updated} existing products`);
    }
    if (skusResult.created === 0 && skusResult.updated === 0) {
      console.log(`   ℹ️  All ${ALENA_SKUS.length} products already exist`);
    }
    console.log('');

    // Step 3: Import sales history (uses upsert - safe to run multiple times)
    console.log(`📈 Step 3: Importing ${ALENA_SALES_DATA.length} sales history records...`);
    const salesResult = await userClient.importSalesHistoryJson(ALENA_SALES_DATA, ctx);
    console.log(
      `   ✅ Imported sales history: ${salesResult.created} created, ${salesResult.updated} updated`,
    );
    console.log('');

    // Success summary
    console.log("🎉 Alena's tenant setup complete!");
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
    console.log(`  • ${ALENA_SALES_DATA.length} sales history records across 3 periods`);
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
