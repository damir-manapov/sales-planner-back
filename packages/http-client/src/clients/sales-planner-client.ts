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

  // Sub-clients
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
