#!/usr/bin/env bun
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SalesPlannerClient, ApiError } from '../../../http-client/dist/index.js';
import {
  getOrCreateTenant,
  initAdminClient,
  printSuccessSummary,
} from '../tenant-setup-helpers.js';

interface AlenaTenantArgs {
  apiUrl?: string;
}

const __dirname = import.meta.dirname;
const SKUS_CSV = readFileSync(join(__dirname, 'original/skus.csv'), 'utf-8');
const SALES_HISTORY_CSV = readFileSync(join(__dirname, 'original/historyOfSales.csv'), 'utf-8');
const BRANDS_CSV = readFileSync(join(__dirname, 'original/brands.csv'), 'utf-8');
const CATEGORIES_CSV = readFileSync(join(__dirname, 'original/categories.csv'), 'utf-8');
const GROUPS_CSV = readFileSync(join(__dirname, 'original/groups.csv'), 'utf-8');
const STATUSES_CSV = readFileSync(join(__dirname, 'original/statuses.csv'), 'utf-8');
const SUPPLIERS_CSV = readFileSync(join(__dirname, 'original/suppliers.csv'), 'utf-8');

function handleError(step: string, error: unknown): never {
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

  // Step 1: Get or create tenant
  let setup: Awaited<ReturnType<typeof getOrCreateTenant>>;
  try {
    setup = await getOrCreateTenant(
      adminClient,
      { tenantTitle, shopTitle, userEmail, userName },
      apiUrl,
    );
  } catch (error) {
    handleError('Step 1: Get or create tenant', error);
  }

  // Create client with user's API key for data operations
  const userClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: setup.apiKey });
  const ctx = { shop_id: setup.shop.id, tenant_id: setup.tenant.id };

  // Step 2: Clear existing shop data
  console.log('🧹 Step 2: Clearing existing shop data...');
  let deleteResult: Awaited<ReturnType<typeof userClient.shops.deleteData>>;
  try {
    deleteResult = await userClient.shops.deleteData(setup.shop.id);
    console.log(
      `   ✅ Deleted ${deleteResult.skusDeleted} SKUs and ${deleteResult.salesHistoryDeleted} sales records`,
    );
  } catch (error) {
    handleError('Step 2: Clear existing shop data', error);
  }
  console.log('');

  // Step 3: Import brands from CSV
  console.log('🏷️  Step 3: Importing brands from CSV...');
  let brandsResult: Awaited<ReturnType<typeof userClient.brands.importCsv>>;
  try {
    brandsResult = await userClient.brands.importCsv(ctx, BRANDS_CSV);
    console.log(`   ✅ Created ${brandsResult.created} brands`);
  } catch (error) {
    handleError('Step 3: Import brands', error);
  }
  console.log('');

  // Step 4: Import categories from CSV
  console.log('📂 Step 4: Importing categories from CSV...');
  let categoriesResult: Awaited<ReturnType<typeof userClient.categories.importCsv>>;
  try {
    categoriesResult = await userClient.categories.importCsv(ctx, CATEGORIES_CSV);
    console.log(`   ✅ Created ${categoriesResult.created} categories`);
  } catch (error) {
    handleError('Step 4: Import categories', error);
  }
  console.log('');

  // Step 5: Import groups from CSV
  console.log('📦 Step 5: Importing groups from CSV...');
  let groupsResult: Awaited<ReturnType<typeof userClient.groups.importCsv>>;
  try {
    groupsResult = await userClient.groups.importCsv(ctx, GROUPS_CSV);
    console.log(`   ✅ Created ${groupsResult.created} groups`);
  } catch (error) {
    handleError('Step 5: Import groups', error);
  }
  console.log('');

  // Step 6: Import statuses from CSV
  console.log('🏷️  Step 6: Importing statuses from CSV...');
  let statusesResult: Awaited<ReturnType<typeof userClient.statuses.importCsv>>;
  try {
    statusesResult = await userClient.statuses.importCsv(ctx, STATUSES_CSV);
    console.log(`   ✅ Created ${statusesResult.created} statuses`);
  } catch (error) {
    handleError('Step 6: Import statuses', error);
  }
  console.log('');

  // Step 7: Import suppliers from CSV
  console.log('🚚 Step 7: Importing suppliers from CSV...');
  let suppliersResult: Awaited<ReturnType<typeof userClient.suppliers.importCsv>>;
  try {
    suppliersResult = await userClient.suppliers.importCsv(ctx, SUPPLIERS_CSV);
    console.log(`   ✅ Created ${suppliersResult.created} suppliers`);
  } catch (error) {
    handleError('Step 7: Import suppliers', error);
  }
  console.log('');

  // Step 8: Import SKUs from CSV
  console.log('💐 Step 8: Importing products from CSV...');
  let skusResult: Awaited<ReturnType<typeof userClient.skus.importCsv>>;
  try {
    skusResult = await userClient.skus.importCsv(ctx, SKUS_CSV);
    console.log(`   ✅ Created ${skusResult.created} products`);
  } catch (error) {
    handleError('Step 8: Import products', error);
  }
  console.log('');

  // Step 9: Import sales history from CSV
  console.log('📈 Step 9: Importing sales history from CSV...');
  let salesResult: Awaited<ReturnType<typeof userClient.salesHistory.importCsv>>;
  try {
    salesResult = await userClient.salesHistory.importCsv(ctx, SALES_HISTORY_CSV);
    console.log(`   ✅ Created ${salesResult.created} sales records`);
  } catch (error) {
    handleError('Step 9: Import sales history', error);
  }
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
