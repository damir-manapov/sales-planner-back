#!/usr/bin/env bun
import 'dotenv/config';
import { SalesPlannerClient } from '@sales-planner/http-client';
import type { ImportSalesHistoryItem, ImportSkuItem } from '@sales-planner/shared';
import skusData from './skus.json';
import salesHistoryData from './sales-history.json';

interface AlenaTenantArgs {
  apiUrl?: string;
}

interface TenantSetup {
  tenant: { id: number; title: string };
  shop: { id: number; title: string };
  user: { id: number; email: string; name: string };
  apiKey: string;
}

const ALENA_SKUS: ImportSkuItem[] = skusData;
const ALENA_SALES_DATA: ImportSalesHistoryItem[] = salesHistoryData;

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

    // Step 2: Clear existing shop data
    console.log('🧹 Step 2: Clearing existing shop data...');
    const deleteResult = await userClient.deleteShopData(setup.shop.id);
    console.log(
      `   ✅ Deleted ${deleteResult.skusDeleted} SKUs and ${deleteResult.salesHistoryDeleted} sales records`,
    );
    console.log('');

    const ctx = { shop_id: setup.shop.id, tenant_id: setup.tenant.id };

    // Step 3: Import SKUs
    console.log(`💐 Step 3: Importing ${ALENA_SKUS.length} products...`);
    const skusResult = await userClient.importSkusJson(ALENA_SKUS, ctx);
    console.log(`   ✅ Created ${skusResult.created} products`);
    console.log('');

    // Step 4: Import sales history
    console.log(`📈 Step 4: Importing ${ALENA_SALES_DATA.length} sales history records...`);
    const salesResult = await userClient.importSalesHistoryJson(ALENA_SALES_DATA, ctx);
    console.log(`   ✅ Created ${salesResult.created} sales records`);
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
