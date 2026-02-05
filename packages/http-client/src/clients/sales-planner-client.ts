import type { ClientConfig } from './base-client.js';
import { ApiError } from './base-client.js';
import { MeClient } from './me-client.js';
import { MetadataClient } from './metadata-client.js';
import { UsersClient } from './users-client.js';
import { TenantsClient } from './tenants-client.js';
import { ShopsClient } from './shops-client.js';
import { SkusClient } from './skus-client.js';
import { BrandsClient } from './brands-client.js';
import { CategoriesClient } from './categories-client.js';
import { GroupsClient } from './groups-client.js';
import { StatusesClient } from './statuses-client.js';
import { SuppliersClient } from './suppliers-client.js';
import { SalesHistoryClient } from './sales-history-client.js';
import { MarketplacesClient } from './marketplaces-client.js';
import { RolesClient } from './roles-client.js';
import { UserRolesClient } from './user-roles-client.js';
import { ApiKeysClient } from './api-keys-client.js';

export class SalesPlannerClient {
  private baseUrl: string;

  // Sub-clients exposed as public properties
  readonly me: MeClient;
  readonly metadata: MetadataClient;
  readonly users: UsersClient;
  readonly tenants: TenantsClient;
  readonly shops: ShopsClient;
  readonly skus: SkusClient;
  readonly brands: BrandsClient;
  readonly categories: CategoriesClient;
  readonly groups: GroupsClient;
  readonly statuses: StatusesClient;
  readonly suppliers: SuppliersClient;
  readonly salesHistory: SalesHistoryClient;
  readonly marketplaces: MarketplacesClient;
  readonly roles: RolesClient;
  readonly userRoles: UserRolesClient;
  readonly apiKeys: ApiKeysClient;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.me = new MeClient(config);
    this.metadata = new MetadataClient(config);
    this.users = new UsersClient(config);
    this.tenants = new TenantsClient(config);
    this.shops = new ShopsClient(config);
    this.skus = new SkusClient(config);
    this.brands = new BrandsClient(config);
    this.categories = new CategoriesClient(config);
    this.groups = new GroupsClient(config);
    this.statuses = new StatusesClient(config);
    this.suppliers = new SuppliersClient(config);
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
  getSkuByCode = (code: string, ctx: Parameters<SkusClient['getSkuByCode']>[1]) =>
    this.skus.getSkuByCode(code, ctx);
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
    items: Parameters<SkusClient['importJson']>[0],
    ctx: Parameters<SkusClient['importJson']>[1],
  ) => this.skus.importJson(items, ctx);
  importSkusCsv = (
    csvContent: Parameters<SkusClient['importCsv']>[0],
    ctx: Parameters<SkusClient['importCsv']>[1],
  ) => this.skus.importCsv(csvContent, ctx);
  exportSkusJson = (ctx: Parameters<SkusClient['exportJson']>[0]) => this.skus.exportJson(ctx);
  exportSkusCsv = (ctx: Parameters<SkusClient['exportCsv']>[0]) => this.skus.exportCsv(ctx);
  getSkusExampleJson = () => this.skus.getExampleJson();
  getSkusExampleCsv = () => this.skus.getExampleCsv();
  getBrands = (ctx: Parameters<BrandsClient['getBrands']>[0]) => this.brands.getBrands(ctx);
  getBrand = (id: number, ctx: Parameters<BrandsClient['getBrand']>[1]) =>
    this.brands.getBrand(id, ctx);
  getBrandByCode = (code: string, ctx: Parameters<BrandsClient['getBrandByCode']>[1]) =>
    this.brands.getBrandByCode(code, ctx);
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
    items: Parameters<BrandsClient['importJson']>[0],
    ctx: Parameters<BrandsClient['importJson']>[1],
  ) => this.brands.importJson(items, ctx);
  importBrandsCsv = (
    csvContent: Parameters<BrandsClient['importCsv']>[0],
    ctx: Parameters<BrandsClient['importCsv']>[1],
  ) => this.brands.importCsv(csvContent, ctx);
  exportBrandsJson = (ctx: Parameters<BrandsClient['exportJson']>[0]) =>
    this.brands.exportJson(ctx);
  exportBrandsCsv = (ctx: Parameters<BrandsClient['exportCsv']>[0]) => this.brands.exportCsv(ctx);
  getBrandsExampleJson = () => this.brands.getExampleJson();
  getBrandsExampleCsv = () => this.brands.getExampleCsv();
  getCategories = (ctx: Parameters<CategoriesClient['getCategories']>[0]) =>
    this.categories.getCategories(ctx);
  getCategory = (id: number, ctx: Parameters<CategoriesClient['getCategory']>[1]) =>
    this.categories.getCategory(id, ctx);
  getCategoryByCode = (code: string, ctx: Parameters<CategoriesClient['getCategoryByCode']>[1]) =>
    this.categories.getCategoryByCode(code, ctx);
  createCategory = (
    dto: Parameters<CategoriesClient['createCategory']>[0],
    ctx: Parameters<CategoriesClient['createCategory']>[1],
  ) => this.categories.createCategory(dto, ctx);
  updateCategory = (
    id: number,
    dto: Parameters<CategoriesClient['updateCategory']>[1],
    ctx: Parameters<CategoriesClient['updateCategory']>[2],
  ) => this.categories.updateCategory(id, dto, ctx);
  deleteCategory = (id: number, ctx: Parameters<CategoriesClient['deleteCategory']>[1]) =>
    this.categories.deleteCategory(id, ctx);
  importCategoriesJson = (
    items: Parameters<CategoriesClient['importJson']>[0],
    ctx: Parameters<CategoriesClient['importJson']>[1],
  ) => this.categories.importJson(items, ctx);
  importCategoriesCsv = (
    csvContent: Parameters<CategoriesClient['importCsv']>[0],
    ctx: Parameters<CategoriesClient['importCsv']>[1],
  ) => this.categories.importCsv(csvContent, ctx);
  exportCategoriesJson = (ctx: Parameters<CategoriesClient['exportJson']>[0]) =>
    this.categories.exportJson(ctx);
  exportCategoriesCsv = (ctx: Parameters<CategoriesClient['exportCsv']>[0]) =>
    this.categories.exportCsv(ctx);
  getCategoriesExampleJson = () => this.categories.getExampleJson();
  getCategoriesExampleCsv = () => this.categories.getExampleCsv();
  getGroups = (ctx: Parameters<GroupsClient['getGroups']>[0]) => this.groups.getGroups(ctx);
  getGroup = (id: number, ctx: Parameters<GroupsClient['getGroup']>[1]) =>
    this.groups.getGroup(id, ctx);
  getGroupByCode = (code: string, ctx: Parameters<GroupsClient['getGroupByCode']>[1]) =>
    this.groups.getGroupByCode(code, ctx);
  createGroup = (
    dto: Parameters<GroupsClient['createGroup']>[0],
    ctx: Parameters<GroupsClient['createGroup']>[1],
  ) => this.groups.createGroup(dto, ctx);
  updateGroup = (
    id: number,
    dto: Parameters<GroupsClient['updateGroup']>[1],
    ctx: Parameters<GroupsClient['updateGroup']>[2],
  ) => this.groups.updateGroup(id, dto, ctx);
  deleteGroup = (id: number, ctx: Parameters<GroupsClient['deleteGroup']>[1]) =>
    this.groups.deleteGroup(id, ctx);
  importGroupsJson = (
    items: Parameters<GroupsClient['importJson']>[0],
    ctx: Parameters<GroupsClient['importJson']>[1],
  ) => this.groups.importJson(items, ctx);
  importGroupsCsv = (
    csvContent: Parameters<GroupsClient['importCsv']>[0],
    ctx: Parameters<GroupsClient['importCsv']>[1],
  ) => this.groups.importCsv(csvContent, ctx);
  exportGroupsJson = (ctx: Parameters<GroupsClient['exportJson']>[0]) =>
    this.groups.exportJson(ctx);
  exportGroupsCsv = (ctx: Parameters<GroupsClient['exportCsv']>[0]) => this.groups.exportCsv(ctx);
  getGroupsExampleJson = () => this.groups.getExampleJson();
  getGroupsExampleCsv = () => this.groups.getExampleCsv();
  getStatuses = (ctx: Parameters<StatusesClient['getStatuses']>[0]) =>
    this.statuses.getStatuses(ctx);
  getStatus = (id: number, ctx: Parameters<StatusesClient['getStatus']>[1]) =>
    this.statuses.getStatus(id, ctx);
  getStatusByCode = (code: string, ctx: Parameters<StatusesClient['getStatusByCode']>[1]) =>
    this.statuses.getStatusByCode(code, ctx);
  createStatus = (
    dto: Parameters<StatusesClient['createStatus']>[0],
    ctx: Parameters<StatusesClient['createStatus']>[1],
  ) => this.statuses.createStatus(dto, ctx);
  updateStatus = (
    id: number,
    dto: Parameters<StatusesClient['updateStatus']>[1],
    ctx: Parameters<StatusesClient['updateStatus']>[2],
  ) => this.statuses.updateStatus(id, dto, ctx);
  deleteStatus = (id: number, ctx: Parameters<StatusesClient['deleteStatus']>[1]) =>
    this.statuses.deleteStatus(id, ctx);
  importStatusesJson = (
    items: Parameters<StatusesClient['importJson']>[0],
    ctx: Parameters<StatusesClient['importJson']>[1],
  ) => this.statuses.importJson(items, ctx);
  importStatusesCsv = (
    csvContent: Parameters<StatusesClient['importCsv']>[0],
    ctx: Parameters<StatusesClient['importCsv']>[1],
  ) => this.statuses.importCsv(csvContent, ctx);
  exportStatusesJson = (ctx: Parameters<StatusesClient['exportJson']>[0]) =>
    this.statuses.exportJson(ctx);
  exportStatusesCsv = (ctx: Parameters<StatusesClient['exportCsv']>[0]) =>
    this.statuses.exportCsv(ctx);
  getStatusesExampleJson = () => this.statuses.getExampleJson();
  getStatusesExampleCsv = () => this.statuses.getExampleCsv();
  getSuppliers = (ctx: Parameters<SuppliersClient['getSuppliers']>[0]) =>
    this.suppliers.getSuppliers(ctx);
  getSupplier = (id: number, ctx: Parameters<SuppliersClient['getSupplier']>[1]) =>
    this.suppliers.getSupplier(id, ctx);
  getSupplierByCode = (code: string, ctx: Parameters<SuppliersClient['getSupplierByCode']>[1]) =>
    this.suppliers.getSupplierByCode(code, ctx);
  createSupplier = (
    dto: Parameters<SuppliersClient['createSupplier']>[0],
    ctx: Parameters<SuppliersClient['createSupplier']>[1],
  ) => this.suppliers.createSupplier(dto, ctx);
  updateSupplier = (
    id: number,
    dto: Parameters<SuppliersClient['updateSupplier']>[1],
    ctx: Parameters<SuppliersClient['updateSupplier']>[2],
  ) => this.suppliers.updateSupplier(id, dto, ctx);
  deleteSupplier = (id: number, ctx: Parameters<SuppliersClient['deleteSupplier']>[1]) =>
    this.suppliers.deleteSupplier(id, ctx);
  importSuppliersJson = (
    items: Parameters<SuppliersClient['importJson']>[0],
    ctx: Parameters<SuppliersClient['importJson']>[1],
  ) => this.suppliers.importJson(items, ctx);
  importSuppliersCsv = (
    csvContent: Parameters<SuppliersClient['importCsv']>[0],
    ctx: Parameters<SuppliersClient['importCsv']>[1],
  ) => this.suppliers.importCsv(csvContent, ctx);
  exportSuppliersJson = (ctx: Parameters<SuppliersClient['exportJson']>[0]) =>
    this.suppliers.exportJson(ctx);
  exportSuppliersCsv = (ctx: Parameters<SuppliersClient['exportCsv']>[0]) =>
    this.suppliers.exportCsv(ctx);
  getSupplierExamplesJson = () => this.suppliers.getExampleJson();
  getSupplierExamplesCsv = () => this.suppliers.getExampleCsv();
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
    items: Parameters<SalesHistoryClient['importJson']>[0],
    ctx: Parameters<SalesHistoryClient['importJson']>[1],
  ) => this.salesHistory.importJson(items, ctx);
  importSalesHistoryCsv = (
    csvContent: Parameters<SalesHistoryClient['importCsv']>[0],
    ctx: Parameters<SalesHistoryClient['importCsv']>[1],
  ) => this.salesHistory.importCsv(csvContent, ctx);
  exportSalesHistoryJson = (
    ctx: Parameters<SalesHistoryClient['exportJson']>[0],
    query?: Parameters<SalesHistoryClient['exportJson']>[1],
  ) => this.salesHistory.exportJson(ctx, query);
  exportSalesHistoryCsv = (
    ctx: Parameters<SalesHistoryClient['exportCsv']>[0],
    query?: Parameters<SalesHistoryClient['exportCsv']>[1],
  ) => this.salesHistory.exportCsv(ctx, query);
  getSalesHistoryExampleJson = () => this.salesHistory.getExampleJson();
  getSalesHistoryExampleCsv = () => this.salesHistory.getExampleCsv();
  getMarketplaces = (ctx: Parameters<MarketplacesClient['getMarketplaces']>[0]) =>
    this.marketplaces.getMarketplaces(ctx);
  getMarketplace = (id: number, ctx: Parameters<MarketplacesClient['getMarketplace']>[1]) =>
    this.marketplaces.getMarketplace(id, ctx);
  getMarketplaceByCode = (
    code: string,
    ctx: Parameters<MarketplacesClient['getMarketplaceByCode']>[1],
  ) => this.marketplaces.getMarketplaceByCode(code, ctx);
  createMarketplace = (
    dto: Parameters<MarketplacesClient['createMarketplace']>[0],
    ctx: Parameters<MarketplacesClient['createMarketplace']>[1],
  ) => this.marketplaces.createMarketplace(dto, ctx);
  updateMarketplace = (
    id: number,
    dto: Parameters<MarketplacesClient['updateMarketplace']>[1],
    ctx: Parameters<MarketplacesClient['updateMarketplace']>[2],
  ) => this.marketplaces.updateMarketplace(id, dto, ctx);
  deleteMarketplace = (id: number, ctx: Parameters<MarketplacesClient['deleteMarketplace']>[1]) =>
    this.marketplaces.deleteMarketplace(id, ctx);
  importMarketplacesJson = (
    items: Parameters<MarketplacesClient['importJson']>[0],
    ctx: Parameters<MarketplacesClient['importJson']>[1],
  ) => this.marketplaces.importJson(items, ctx);
  importMarketplacesCsv = (
    csvContent: Parameters<MarketplacesClient['importCsv']>[0],
    ctx: Parameters<MarketplacesClient['importCsv']>[1],
  ) => this.marketplaces.importCsv(csvContent, ctx);
  exportMarketplacesJson = (ctx: Parameters<MarketplacesClient['exportJson']>[0]) =>
    this.marketplaces.exportJson(ctx);
  exportMarketplacesCsv = (ctx: Parameters<MarketplacesClient['exportCsv']>[0]) =>
    this.marketplaces.exportCsv(ctx);
  getMarketplaceExamplesJson = () => this.marketplaces.getExampleJson();
  getMarketplaceExamplesCsv = () => this.marketplaces.getExampleCsv();
  getRoles = () => this.roles.getRoles();
  getRole = (id: number) => this.roles.getRole(id);
  createRole = (dto: Parameters<RolesClient['createRole']>[0]) => this.roles.createRole(dto);
  updateRole = (id: number, dto: Parameters<RolesClient['updateRole']>[1]) =>
    this.roles.updateRole(id, dto);
  deleteRole = (id: number) => this.roles.deleteRole(id);
  getUserRoles = (query?: Parameters<UserRolesClient['getUserRoles']>[0]) =>
    this.userRoles.getUserRoles(query);
  getUserRole = (id: number) => this.userRoles.getUserRole(id);
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
