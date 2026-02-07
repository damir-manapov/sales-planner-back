#!/usr/bin/env bun
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SalesPlannerClient } from '../../../http-client/dist/index.js';
import {
  getOrCreateTenant,
  initAdminClient,
  printSuccessSummary,
  runStep,
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
  const setup = await runStep(
    1,
    '🔍',
    'Get or create tenant',
    () => getOrCreateTenant(adminClient, { tenantTitle, shopTitle, userEmail, userName }, apiUrl),
    (s) => `Tenant: ${s.tenant.title} (ID: ${s.tenant.id})`,
  );

  // Create client with user's API key for data operations
  const userClient = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: setup.apiKey });
  const ctx = { shop_id: setup.shop.id, tenant_id: setup.tenant.id };

  // Step 2: Clear existing shop data
  await runStep(
    2,
    '🧹',
    'Clearing existing shop data',
    () => userClient.shops.deleteData(setup.shop.id),
    (r) =>
      `Deleted ${r.skusDeleted} SKUs, ${r.salesHistoryDeleted} sales, ${r.brandsDeleted} brands, ${r.categoriesDeleted} categories, ${r.groupsDeleted} groups, ${r.statusesDeleted} statuses, ${r.suppliersDeleted} suppliers`,
  );

  // Step 3-7: Import reference data
  const brandsResult = await runStep(
    3,
    '🏷️',
    'Importing brands',
    () => userClient.brands.importCsv(ctx, BRANDS_CSV),
    (r) => `Created ${r.created} brands`,
  );

  const categoriesResult = await runStep(
    4,
    '📂',
    'Importing categories',
    () => userClient.categories.importCsv(ctx, CATEGORIES_CSV),
    (r) => `Created ${r.created} categories`,
  );

  const groupsResult = await runStep(
    5,
    '📦',
    'Importing groups',
    () => userClient.groups.importCsv(ctx, GROUPS_CSV),
    (r) => `Created ${r.created} groups`,
  );

  const statusesResult = await runStep(
    6,
    '🏷️',
    'Importing statuses',
    () => userClient.statuses.importCsv(ctx, STATUSES_CSV),
    (r) => `Created ${r.created} statuses`,
  );

  const suppliersResult = await runStep(
    7,
    '🚚',
    'Importing suppliers',
    () => userClient.suppliers.importCsv(ctx, SUPPLIERS_CSV),
    (r) => `Created ${r.created} suppliers`,
  );

  // Step 8: Import products
  const skusResult = await runStep(
    8,
    '💐',
    'Importing products',
    () => userClient.skus.importCsv(ctx, SKUS_CSV),
    (r) => `Created ${r.created} products`,
  );

  // Step 9: Import sales history
  const salesResult = await runStep(
    9,
    '📈',
    'Importing sales history',
    () => userClient.salesHistory.importCsv(ctx, SALES_HISTORY_CSV),
    (r) => `Created ${r.created} sales records`,
  );

  // Success summary
  printSuccessSummary(setup, [
    `${brandsResult.created} brands`,
    `${categoriesResult.created} categories`,
    `${groupsResult.created} groups`,
    `${statusesResult.created} statuses`,
    `${suppliersResult.created} suppliers`,
    `${skusResult.created} products`,
    `${salesResult.created} sales history records`,
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
