import type {
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
  ImportBrandItem,
  BrandExportItem,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ImportCategoryItem,
  CategoryExportItem,
  CompetitorProduct,
  CreateCompetitorProductRequest,
  UpdateCompetitorProductRequest,
  ImportCompetitorProductItem,
  CompetitorProductExportItem,
  CompetitorProductQuery,
  CompetitorSale,
  CreateCompetitorSaleRequest,
  UpdateCompetitorSaleRequest,
  ImportCompetitorSaleItem,
  CompetitorSaleExportItem,
  CompetitorSaleQuery,
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem,
  Leftover,
  CreateLeftoverRequest,
  UpdateLeftoverRequest,
  ImportLeftoverItem,
  LeftoverExportItem,
  LeftoverQuery,
  PaginationQuery,
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
  ImportStatusItem,
  StatusExportItem,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  ImportSupplierItem,
  SupplierExportItem,
  SeasonalCoefficient,
  CreateSeasonalCoefficientRequest,
  UpdateSeasonalCoefficientRequest,
  ImportSeasonalCoefficientItem,
  SeasonalCoefficientExportItem,
  SkuCompetitorMapping,
  CreateSkuCompetitorMappingRequest,
  UpdateSkuCompetitorMappingRequest,
  ImportSkuCompetitorMappingItem,
  SkuCompetitorMappingExportItem,
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  ImportWarehouseItem,
  WarehouseExportItem,
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  SalesHistory,
  CreateSalesHistoryRequest,
  UpdateSalesHistoryRequest,
  ImportSalesHistoryItem,
  SalesHistoryExportItem,
  SalesHistoryImportResult,
  SalesHistoryQuery,
  ImportResult,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { ApiError } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';
import { CrudClient } from './crud-client.js';
import { ShopScopedClient } from './shop-scoped-client.js';
import { MeClient } from './me-client.js';
import { MetadataClient } from './metadata-client.js';
import { UsersClient } from './users-client.js';
import { TenantsClient } from './tenants-client.js';
import { ShopsClient } from './shops-client.js';
import { SkusClient } from './skus-client.js';
import { UserRolesClient } from './user-roles-client.js';
import { ApiKeysClient } from './api-keys-client.js';
import { SkuMetricsClient } from './sku-metrics-client.js';
import { ComputedEntitiesClient } from './computed-entities-client.js';

export class SalesPlannerClient {
  private baseUrl: string;

  // Sub-clients
  readonly me: MeClient;
  readonly metadata: MetadataClient;
  readonly users: UsersClient;
  readonly tenants: TenantsClient;
  readonly shops: ShopsClient;
  readonly skus: SkusClient;
  readonly brands: CodedEntityClient<
    Brand,
    CreateBrandRequest,
    UpdateBrandRequest,
    ImportBrandItem,
    BrandExportItem
  >;
  readonly categories: CodedEntityClient<
    Category,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    ImportCategoryItem,
    CategoryExportItem
  >;
  readonly groups: CodedEntityClient<
    Group,
    CreateGroupRequest,
    UpdateGroupRequest,
    ImportGroupItem,
    GroupExportItem
  >;
  readonly statuses: CodedEntityClient<
    Status,
    CreateStatusRequest,
    UpdateStatusRequest,
    ImportStatusItem,
    StatusExportItem
  >;
  readonly suppliers: CodedEntityClient<
    Supplier,
    CreateSupplierRequest,
    UpdateSupplierRequest,
    ImportSupplierItem,
    SupplierExportItem
  >;
  readonly warehouses: CodedEntityClient<
    Warehouse,
    CreateWarehouseRequest,
    UpdateWarehouseRequest,
    ImportWarehouseItem,
    WarehouseExportItem
  >;
  readonly marketplaces: CodedEntityClient<
    Marketplace,
    CreateMarketplaceRequest,
    UpdateMarketplaceRequest,
    ImportMarketplaceItem,
    MarketplaceExportItem
  >;
  readonly salesHistory: ShopScopedClient<
    SalesHistory,
    CreateSalesHistoryRequest,
    UpdateSalesHistoryRequest,
    ImportSalesHistoryItem,
    SalesHistoryExportItem,
    SalesHistoryImportResult,
    SalesHistoryQuery
  >;
  readonly leftovers: ShopScopedClient<
    Leftover,
    CreateLeftoverRequest,
    UpdateLeftoverRequest,
    ImportLeftoverItem,
    LeftoverExportItem,
    ImportResult,
    LeftoverQuery
  >;
  readonly seasonalCoefficients: ShopScopedClient<
    SeasonalCoefficient,
    CreateSeasonalCoefficientRequest,
    UpdateSeasonalCoefficientRequest,
    ImportSeasonalCoefficientItem,
    SeasonalCoefficientExportItem,
    ImportResult,
    PaginationQuery
  >;
  readonly skuCompetitorMappings: ShopScopedClient<
    SkuCompetitorMapping,
    CreateSkuCompetitorMappingRequest,
    UpdateSkuCompetitorMappingRequest,
    ImportSkuCompetitorMappingItem,
    SkuCompetitorMappingExportItem,
    ImportResult,
    PaginationQuery
  >;
  readonly competitorProducts: ShopScopedClient<
    CompetitorProduct,
    CreateCompetitorProductRequest,
    UpdateCompetitorProductRequest,
    ImportCompetitorProductItem,
    CompetitorProductExportItem,
    ImportResult,
    CompetitorProductQuery
  >;
  readonly competitorSales: ShopScopedClient<
    CompetitorSale,
    CreateCompetitorSaleRequest,
    UpdateCompetitorSaleRequest,
    ImportCompetitorSaleItem,
    CompetitorSaleExportItem,
    ImportResult,
    CompetitorSaleQuery
  >;
  readonly roles: CrudClient<Role, CreateRoleRequest, UpdateRoleRequest>;
  readonly userRoles: UserRolesClient;
  readonly apiKeys: ApiKeysClient;
  readonly skuMetrics: SkuMetricsClient;
  readonly computed: ComputedEntitiesClient;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.me = new MeClient(config);
    this.metadata = new MetadataClient(config);
    this.users = new UsersClient(config);
    this.tenants = new TenantsClient(config);
    this.shops = new ShopsClient(config);
    this.skus = new SkusClient(config);
    this.brands = new CodedEntityClient(config, 'brands');
    this.categories = new CodedEntityClient(config, 'categories');
    this.groups = new CodedEntityClient(config, 'groups');
    this.statuses = new CodedEntityClient(config, 'statuses');
    this.suppliers = new CodedEntityClient(config, 'suppliers');
    this.warehouses = new CodedEntityClient(config, 'warehouses');
    this.marketplaces = new CodedEntityClient(config, 'marketplaces');
    this.salesHistory = new ShopScopedClient(config, 'sales-history');
    this.leftovers = new ShopScopedClient(config, 'leftovers');
    this.seasonalCoefficients = new ShopScopedClient(config, 'seasonal-coefficients');
    this.skuCompetitorMappings = new ShopScopedClient(config, 'sku-competitor-mappings');
    this.competitorProducts = new ShopScopedClient(config, 'competitor-products');
    this.competitorSales = new ShopScopedClient(config, 'competitor-sales');
    this.roles = new CrudClient(config, 'roles');
    this.userRoles = new UserRolesClient(config);
    this.apiKeys = new ApiKeysClient(config);
    this.skuMetrics = new SkuMetricsClient(config);
    this.computed = new ComputedEntitiesClient(config);
  }

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
