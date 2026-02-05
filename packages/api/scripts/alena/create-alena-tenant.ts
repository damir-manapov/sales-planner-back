#!/usr/bin/env bun
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SalesPlannerClient } from '../../../http-client/dist/index.js';
import {
  getOrCreateTenant,
  initAdminClient,
  printSuccessSummary,
} from '../tenant-setup-helpers.js';

interface AlenaTenantArgs {
  apiUrl?: string;
}

const __dirname = import.meta.dirname;
const SKUS_CSV = readFileSync(join(__dirname, 'skus.csv'), 'utf-8');
const SALES_HISTORY_CSV = readFileSync(join(__dirname, 'original/historyOfSales.csv'), 'utf-8');
const BRANDS_CSV = readFileSync(join(__dirname, 'original/brands.csv'), 'utf-8');
const CATEGORIES_CSV = readFileSync(join(__dirname, 'original/categories.csv'), 'utf-8');
const GROUPS_CSV = readFileSync(join(__dirname, 'original/groups.csv'), 'utf-8');
const STATUSES_CSV = readFileSync(join(__dirname, 'original/statuses.csv'), 'utf-8');
const SUPPLIERS_CSV = readFileSync(join(__dirname, 'original/suppliers.csv'), 'utf-8');

async function createAlenaTenant(args: AlenaTenantArgs) {
  const { client: adminClient, apiUrl } = initAdminClient(args.apiUrl);

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
    // Step 1: Get or create tenant
    const setup = await getOrCreateTenant(
      adminClient,
      { tenantTitle, shopTitle, userEmail, userName },
      apiUrl,
    );

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

    // Step 3: Import brands from CSV
    console.log('🏷️  Step 3: Importing brands from CSV...');
    const brandsResult = await userClient.importBrandsCsv(BRANDS_CSV, ctx);
    console.log(`   ✅ Created ${brandsResult.created} brands`);
    console.log('');

    // Step 4: Import categories from CSV
    console.log('📂 Step 4: Importing categories from CSV...');
    const categoriesResult = await userClient.importCategoriesCsv(CATEGORIES_CSV, ctx);
    console.log(`   ✅ Created ${categoriesResult.created} categories`);
    console.log('');

    // Step 5: Import groups from CSV
    console.log('📦 Step 5: Importing groups from CSV...');
    const groupsResult = await userClient.importGroupsCsv(GROUPS_CSV, ctx);
    console.log(`   ✅ Created ${groupsResult.created} groups`);
    console.log('');

    // Step 6: Import statuses from CSV
    console.log('🏷️  Step 6: Importing statuses from CSV...');
    const statusesResult = await userClient.importStatusesCsv(STATUSES_CSV, ctx);
    console.log(`   ✅ Created ${statusesResult.created} statuses`);
    console.log('');

    // Step 7: Import suppliers from CSV
    console.log('🚚 Step 7: Importing suppliers from CSV...');
    const suppliersResult = await userClient.importSuppliersCsv(SUPPLIERS_CSV, ctx);
    console.log(`   ✅ Created ${suppliersResult.created} suppliers`);
    console.log('');

    // Step 8: Import SKUs from CSV
    console.log('💐 Step 8: Importing products from CSV...');
    const skusResult = await userClient.importSkusCsv(SKUS_CSV, ctx);
    console.log(`   ✅ Created ${skusResult.created} products`);
    console.log('');

    // Step 9: Import sales history from CSV
    console.log('📈 Step 9: Importing sales history from CSV...');
    const salesResult = await userClient.importSalesHistoryCsv(SALES_HISTORY_CSV, ctx);
    console.log(`   ✅ Created ${salesResult.created} sales records`);
    console.log('');

    // Success summary
    printSuccessSummary(setup, [
      `${brandsResult.created} brands`,
      `${categoriesResult.created} categories`,
      `${groupsResult.created} groups`,
      `${statusesResult.created} statuses`,
      `${suppliersResult.created} suppliers`,
      `${skusResult.created} products (flowers and gifts)`,
      `${salesResult.created} sales history records across 3 periods`,
      'Periods: 2025-11, 2025-12, 2026-01',
    ]);

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
  SYSTEM_ADMIN_KEY                  System admin API key (required)
  SALES_PLANNER_API_URL             Base API URL (optional)

Shop Data Includes:
  • 15 products (flowers and gifts)
  • 11 categories
  • 20 groups
  • 2 statuses
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
