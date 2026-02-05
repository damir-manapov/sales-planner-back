import type { ClientConfig } from './base-client.js';
import { ApiError } from './base-client.js';
import { MeClient } from './me-client.js';
import { UsersClient } from './users-client.js';
import { TenantsClient } from './tenants-client.js';
import { ShopsClient } from './shops-client.js';
import { SkusClient } from './skus-client.js';
import { BrandsClient } from './brands-client.js';
import { SalesHistoryClient } from './sales-history-client.js';
import { MarketplacesClient } from './marketplaces-client.js';
import { RolesClient } from './roles-client.js';
import { UserRolesClient } from './user-roles-client.js';
import { ApiKeysClient } from './api-keys-client.js';

export class SalesPlannerClient {
  private baseUrl: string;

  // Sub-clients exposed as public properties
  readonly me: MeClient;
  readonly users: UsersClient;
  readonly tenants: TenantsClient;
  readonly shops: ShopsClient;
  readonly skus: SkusClient;
  readonly brands: BrandsClient;
  readonly salesHistory: SalesHistoryClient;
  readonly marketplaces: MarketplacesClient;
  readonly roles: RolesClient;
  readonly userRoles: UserRolesClient;
  readonly apiKeys: ApiKeysClient;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.me = new MeClient(config);
    this.users = new UsersClient(config);
    this.tenants = new TenantsClient(config);
    this.shops = new ShopsClient(config);
    this.skus = new SkusClient(config);
    this.brands = new BrandsClient(config);
    this.salesHistory = new SalesHistoryClient(config);
    this.marketplaces = new MarketplacesClient(config);
    this.roles = new RolesClient(config);
    this.userRoles = new UserRolesClient(config);
    this.apiKeys = new ApiKeysClient(config);
  }

  // Backward compatibility - delegate to sub-clients
  getMe = () => this.me.getMe();
  getUsers = () => this.users.getUsers();
  getUser = (id: number) => this.users.getUser(id);
  createUser = (dto: Parameters<UsersClient['createUser']>[0]) => this.users.createUser(dto);
  deleteUser = (id: number) => this.users.deleteUser(id);
  getTenants = () => this.tenants.getTenants();
  getTenant = (id: number) => this.tenants.getTenant(id);
  createTenant = (dto: Parameters<TenantsClient['createTenant']>[0]) =>
    this.tenants.createTenant(dto);
  createTenantWithShopAndUser = (
    dto: Parameters<TenantsClient['createTenantWithShopAndUser']>[0],
  ) => this.tenants.createTenantWithShopAndUser(dto);
  updateTenant = (id: number, dto: Parameters<TenantsClient['updateTenant']>[1]) =>
    this.tenants.updateTenant(id, dto);
  deleteTenant = (id: number) => this.tenants.deleteTenant(id);
  getShops = (tenantId?: number) => this.shops.getShops(tenantId);
  getShop = (id: number) => this.shops.getShop(id);
  createShop = (dto: Parameters<ShopsClient['createShop']>[0]) => this.shops.createShop(dto);
  updateShop = (id: number, dto: Parameters<ShopsClient['updateShop']>[1]) =>
    this.shops.updateShop(id, dto);
  deleteShop = (id: number) => this.shops.deleteShop(id);
  deleteShopData = (id: number) => this.shops.deleteShopData(id);
  getSkus = (ctx: Parameters<SkusClient['getSkus']>[0]) => this.skus.getSkus(ctx);
  getSku = (id: number, ctx: Parameters<SkusClient['getSku']>[1]) => this.skus.getSku(id, ctx);
  createSku = (
    dto: Parameters<SkusClient['createSku']>[0],
    ctx: Parameters<SkusClient['createSku']>[1],
  ) => this.skus.createSku(dto, ctx);
  updateSku = (
    id: number,
    dto: Parameters<SkusClient['updateSku']>[1],
    ctx: Parameters<SkusClient['updateSku']>[2],
  ) => this.skus.updateSku(id, dto, ctx);
  deleteSku = (id: number, ctx: Parameters<SkusClient['deleteSku']>[1]) =>
    this.skus.deleteSku(id, ctx);
  importSkusJson = (
    items: Parameters<SkusClient['importSkusJson']>[0],
    ctx: Parameters<SkusClient['importSkusJson']>[1],
  ) => this.skus.importSkusJson(items, ctx);
  importSkusCsv = (
    csvContent: Parameters<SkusClient['importSkusCsv']>[0],
    ctx: Parameters<SkusClient['importSkusCsv']>[1],
  ) => this.skus.importSkusCsv(csvContent, ctx);
  exportSkusJson = (ctx: Parameters<SkusClient['exportSkusJson']>[0]) =>
    this.skus.exportSkusJson(ctx);
  exportSkusCsv = (ctx: Parameters<SkusClient['exportSkusCsv']>[0]) => this.skus.exportSkusCsv(ctx);
  getSkusExampleJson = () => this.skus.getSkusExampleJson();
  getSkusExampleCsv = () => this.skus.getSkusExampleCsv();
  getBrands = (ctx: Parameters<BrandsClient['getBrands']>[0]) => this.brands.getBrands(ctx);
  getBrand = (id: number, ctx: Parameters<BrandsClient['getBrand']>[1]) =>
    this.brands.getBrand(id, ctx);
  createBrand = (
    dto: Parameters<BrandsClient['createBrand']>[0],
    ctx: Parameters<BrandsClient['createBrand']>[1],
  ) => this.brands.createBrand(dto, ctx);
  updateBrand = (
    id: number,
    dto: Parameters<BrandsClient['updateBrand']>[1],
    ctx: Parameters<BrandsClient['updateBrand']>[2],
  ) => this.brands.updateBrand(id, dto, ctx);
  deleteBrand = (id: number, ctx: Parameters<BrandsClient['deleteBrand']>[1]) =>
    this.brands.deleteBrand(id, ctx);
  importBrandsJson = (
    items: Parameters<BrandsClient['importBrandsJson']>[0],
    ctx: Parameters<BrandsClient['importBrandsJson']>[1],
  ) => this.brands.importBrandsJson(items, ctx);
  importBrandsCsv = (
    csvContent: Parameters<BrandsClient['importBrandsCsv']>[0],
    ctx: Parameters<BrandsClient['importBrandsCsv']>[1],
  ) => this.brands.importBrandsCsv(csvContent, ctx);
  exportBrandsJson = (ctx: Parameters<BrandsClient['exportBrandsJson']>[0]) =>
    this.brands.exportBrandsJson(ctx);
  exportBrandsCsv = (ctx: Parameters<BrandsClient['exportBrandsCsv']>[0]) =>
    this.brands.exportBrandsCsv(ctx);
  getSalesHistory = (
    ctx: Parameters<SalesHistoryClient['getSalesHistory']>[0],
    query?: Parameters<SalesHistoryClient['getSalesHistory']>[1],
  ) => this.salesHistory.getSalesHistory(ctx, query);
  getSalesHistoryItem = (
    id: number,
    ctx: Parameters<SalesHistoryClient['getSalesHistoryItem']>[1],
  ) => this.salesHistory.getSalesHistoryItem(id, ctx);
  createSalesHistory = (
    dto: Parameters<SalesHistoryClient['createSalesHistory']>[0],
    ctx: Parameters<SalesHistoryClient['createSalesHistory']>[1],
  ) => this.salesHistory.createSalesHistory(dto, ctx);
  updateSalesHistory = (
    id: number,
    dto: Parameters<SalesHistoryClient['updateSalesHistory']>[1],
    ctx: Parameters<SalesHistoryClient['updateSalesHistory']>[2],
  ) => this.salesHistory.updateSalesHistory(id, dto, ctx);
  deleteSalesHistory = (id: number, ctx: Parameters<SalesHistoryClient['deleteSalesHistory']>[1]) =>
    this.salesHistory.deleteSalesHistory(id, ctx);
  importSalesHistoryJson = (
    items: Parameters<SalesHistoryClient['importSalesHistoryJson']>[0],
    ctx: Parameters<SalesHistoryClient['importSalesHistoryJson']>[1],
  ) => this.salesHistory.importSalesHistoryJson(items, ctx);
  importSalesHistoryCsv = (
    csvContent: Parameters<SalesHistoryClient['importSalesHistoryCsv']>[0],
    ctx: Parameters<SalesHistoryClient['importSalesHistoryCsv']>[1],
  ) => this.salesHistory.importSalesHistoryCsv(csvContent, ctx);
  exportSalesHistoryJson = (
    ctx: Parameters<SalesHistoryClient['exportSalesHistoryJson']>[0],
    query?: Parameters<SalesHistoryClient['exportSalesHistoryJson']>[1],
  ) => this.salesHistory.exportSalesHistoryJson(ctx, query);
  exportSalesHistoryCsv = (
    ctx: Parameters<SalesHistoryClient['exportSalesHistoryCsv']>[0],
    query?: Parameters<SalesHistoryClient['exportSalesHistoryCsv']>[1],
  ) => this.salesHistory.exportSalesHistoryCsv(ctx, query);
  getSalesHistoryExampleJson = () => this.salesHistory.getSalesHistoryExampleJson();
  getSalesHistoryExampleCsv = () => this.salesHistory.getSalesHistoryExampleCsv();
  getMarketplaces = (ctx: Parameters<MarketplacesClient['getMarketplaces']>[0]) =>
    this.marketplaces.getMarketplaces(ctx);
  getMarketplace = (id: string, ctx: Parameters<MarketplacesClient['getMarketplace']>[1]) =>
    this.marketplaces.getMarketplace(id, ctx);
  createMarketplace = (
    dto: Parameters<MarketplacesClient['createMarketplace']>[0],
    ctx: Parameters<MarketplacesClient['createMarketplace']>[1],
  ) => this.marketplaces.createMarketplace(dto, ctx);
  updateMarketplace = (
    id: string,
    dto: Parameters<MarketplacesClient['updateMarketplace']>[1],
    ctx: Parameters<MarketplacesClient['updateMarketplace']>[2],
  ) => this.marketplaces.updateMarketplace(id, dto, ctx);
  deleteMarketplace = (id: string, ctx: Parameters<MarketplacesClient['deleteMarketplace']>[1]) =>
    this.marketplaces.deleteMarketplace(id, ctx);
  importMarketplacesJson = (
    items: Parameters<MarketplacesClient['importMarketplacesJson']>[0],
    ctx: Parameters<MarketplacesClient['importMarketplacesJson']>[1],
  ) => this.marketplaces.importMarketplacesJson(items, ctx);
  importMarketplacesCsv = (
    csvContent: Parameters<MarketplacesClient['importMarketplacesCsv']>[0],
    ctx: Parameters<MarketplacesClient['importMarketplacesCsv']>[1],
  ) => this.marketplaces.importMarketplacesCsv(csvContent, ctx);
  exportMarketplacesJson = (ctx: Parameters<MarketplacesClient['exportMarketplacesJson']>[0]) =>
    this.marketplaces.exportMarketplacesJson(ctx);
  exportMarketplacesCsv = (ctx: Parameters<MarketplacesClient['exportMarketplacesCsv']>[0]) =>
    this.marketplaces.exportMarketplacesCsv(ctx);
  getMarketplaceExamplesJson = () => this.marketplaces.getMarketplaceExamplesJson();
  getMarketplaceExamplesCsv = () => this.marketplaces.getMarketplaceExamplesCsv();
  getRoles = () => this.roles.getRoles();
  getRole = (id: number) => this.roles.getRole(id);
  createRole = (dto: Parameters<RolesClient['createRole']>[0]) => this.roles.createRole(dto);
  updateRole = (id: number, dto: Parameters<RolesClient['updateRole']>[1]) =>
    this.roles.updateRole(id, dto);
  deleteRole = (id: number) => this.roles.deleteRole(id);
  createUserRole = (dto: Parameters<UserRolesClient['createUserRole']>[0]) =>
    this.userRoles.createUserRole(dto);
  deleteUserRole = (id: number) => this.userRoles.deleteUserRole(id);
  getApiKeys = (userId?: number) => this.apiKeys.getApiKeys(userId);
  createApiKey = (dto: Parameters<ApiKeysClient['createApiKey']>[0]) =>
    this.apiKeys.createApiKey(dto);
  deleteApiKey = (id: number) => this.apiKeys.deleteApiKey(id);

  // Health & Info (unauthenticated)
  async getRoot(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return response.text();
  }

  async getHealth(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return response.json();
  }
}
