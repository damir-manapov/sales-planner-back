#!/usr/bin/env bun
import 'dotenv/config';
import { SalesPlannerClient } from '@sales-planner/http-client';

interface CreateTenantArgs {
  tenantTitle: string;
  userEmail?: string;
  userName?: string;
  apiUrl?: string;
}

async function createTenantWithShopAndUser(args: CreateTenantArgs) {
  const apiUrl = args.apiUrl || process.env.SALES_PLANNER_API_URL || 'http://localhost:3000';
  const systemAdminKey = process.env.SYSTEM_ADMIN_KEY;

  if (!systemAdminKey) {
    console.error('Error: SYSTEM_ADMIN_KEY environment variable is required');
    process.exit(1);
  }

  const client = new SalesPlannerClient({ baseUrl: apiUrl, apiKey: systemAdminKey });

  // Derive user details from tenant title if not provided
  const tenantSlug = args.tenantTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const userEmail = args.userEmail || `admin@${tenantSlug}.com`;
  const userName = args.userName || `${args.tenantTitle} Admin`;

  console.log(`Creating tenant: ${args.tenantTitle}`);
  console.log(`User: ${userName} (${userEmail})`);
  console.log(`API URL: ${apiUrl}`);
  console.log('');

  try {
    const result = await client.createTenantWithShopAndUser({
      tenantTitle: args.tenantTitle,
      userEmail,
      userName,
    });

    console.log('✅ Tenant created successfully!');
    console.log('');
    console.log('Tenant:', result.tenant);
    console.log('Shop:', result.shop);
    console.log('User:', result.user);
    console.log('');
    console.log('🔑 API Key:', result.apiKey);
    console.log('');
    console.log('Save this API key - it will not be shown again!');

    return result;
  } catch (error) {
    console.error('Error creating tenant:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: bun scripts/create-tenant.ts [options]

Options:
  --tenant-title <title>    Tenant/company name (required)
  --user-email <email>      Owner's email address (optional, derived from tenant title if not provided)
  --user-name <name>        Owner's full name (optional, derived from tenant title if not provided)
  --api-url <url>           API URL (default: http://localhost:3000 or SALES_PLANNER_API_URL env var)
  --help, -h                Show this help message

Environment Variables:
  SYSTEM_ADMIN_KEY                System admin API key (required)
  SALES_PLANNER_API_URL           Default API URL

Example:
  # Minimal usage (email and name auto-generated)
  bun scripts/create-tenant.ts --tenant-title "Acme Corp"
  # Creates user: "Acme Corp Admin" <admin@acme-corp.com>

  # With custom user details
  bun scripts/create-tenant.ts \\
    --tenant-title "Acme Corp" \\
    --user-email "admin@acme.com" \\
    --user-name "John Doe"

  # For production
  SALES_PLANNER_API_URL=https://sales-planner-back.vercel.app \
    bun scripts/create-tenant.ts \\
    --tenant-title "Acme Corp"
`);
  process.exit(0);
}

const parsedArgs: CreateTenantArgs = {
  tenantTitle: '',
  userEmail: '',
  userName: '',
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const nextArg = args[i + 1];

  switch (arg) {
    case '--tenant-title':
      if (nextArg && !nextArg.startsWith('-')) {
        parsedArgs.tenantTitle = nextArg;
        i++;
      }
      break;
    case '--user-email':
      parsedArgs.userEmail = nextArg;
      i++;
      break;
    case '--user-name':
      parsedArgs.userName = nextArg;
      i++;
      break;
    case '--api-url':
      parsedArgs.apiUrl = nextArg;
      i++;
      break;
  }
}

// Validate required arguments
if (!parsedArgs.tenantTitle) {
  console.error('Error: Missing required argument: --tenant-title');
  console.error('');
  console.error('Run with --help for usage information');
  process.exit(1);
}

// Run the script
createTenantWithShopAndUser(parsedArgs);
