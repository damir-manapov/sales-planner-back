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
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem,
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
  Marketplace,
  CreateMarketplaceRequest,
  UpdateMarketplaceRequest,
  ImportMarketplaceItem,
  MarketplaceExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { ApiError } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';
import { MeClient } from './me-client.js';
import { MetadataClient } from './metadata-client.js';
import { UsersClient } from './users-client.js';
import { TenantsClient } from './tenants-client.js';
import { ShopsClient } from './shops-client.js';
import { SkusClient } from './skus-client.js';
import { SalesHistoryClient } from './sales-history-client.js';
import { RolesClient } from './roles-client.js';
import { UserRolesClient } from './user-roles-client.js';
import { ApiKeysClient } from './api-keys-client.js';

export class SalesPlannerClient {
  private baseUrl: string;

  // Sub-clients
  readonly me: MeClient;
  readonly metadata: MetadataClient;
  readonly users: UsersClient;
  readonly tenants: TenantsClient;
  readonly shops: ShopsClient;
  readonly skus: SkusClient;
  readonly brands: CodedEntityClient<Brand, CreateBrandRequest, UpdateBrandRequest, ImportBrandItem, BrandExportItem>;
  readonly categories: CodedEntityClient<Category, CreateCategoryRequest, UpdateCategoryRequest, ImportCategoryItem, CategoryExportItem>;
  readonly groups: CodedEntityClient<Group, CreateGroupRequest, UpdateGroupRequest, ImportGroupItem, GroupExportItem>;
  readonly statuses: CodedEntityClient<Status, CreateStatusRequest, UpdateStatusRequest, ImportStatusItem, StatusExportItem>;
  readonly suppliers: CodedEntityClient<Supplier, CreateSupplierRequest, UpdateSupplierRequest, ImportSupplierItem, SupplierExportItem>;
  readonly marketplaces: CodedEntityClient<Marketplace, CreateMarketplaceRequest, UpdateMarketplaceRequest, ImportMarketplaceItem, MarketplaceExportItem>;
  readonly salesHistory: SalesHistoryClient;
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
    this.brands = new CodedEntityClient(config, 'brands');
    this.categories = new CodedEntityClient(config, 'categories');
    this.groups = new CodedEntityClient(config, 'groups');
    this.statuses = new CodedEntityClient(config, 'statuses');
    this.suppliers = new CodedEntityClient(config, 'suppliers');
    this.marketplaces = new CodedEntityClient(config, 'marketplaces');
    this.salesHistory = new SalesHistoryClient(config);
    this.roles = new RolesClient(config);
    this.userRoles = new UserRolesClient(config);
    this.apiKeys = new ApiKeysClient(config);
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
