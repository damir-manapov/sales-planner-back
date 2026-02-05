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
const SALES_HISTORY_CSV = readFileSync(join(__dirname, 'sales-history.csv'), 'utf-8');

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

    // Step 3: Import SKUs from CSV
    console.log('💐 Step 3: Importing products from CSV...');
    const skusResult = await userClient.importSkusCsv(SKUS_CSV, ctx);
    console.log(`   ✅ Created ${skusResult.created} products`);
    console.log('');

    // Step 4: Import sales history from CSV
    console.log('📈 Step 4: Importing sales history from CSV...');
    const salesResult = await userClient.importSalesHistoryCsv(SALES_HISTORY_CSV, ctx);
    console.log(`   ✅ Created ${salesResult.created} sales records`);
    console.log('');

    // Success summary
    printSuccessSummary(setup, [
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
