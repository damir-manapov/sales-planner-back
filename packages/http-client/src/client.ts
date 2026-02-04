import type {
  ApiKey,
  Marketplace,
  Role,
  SalesHistory,
  Shop,
  Sku,
  Tenant,
  User,
  CreateApiKeyDto,
  CreateMarketplaceRequest,
  CreateRoleDto,
  CreateSalesHistoryRequest,
  CreateShopDto,
  CreateSkuRequest,
  CreateTenantDto,
  CreateTenantWithShopDto,
  CreateUserDto,
  CreateUserRoleDto,
  ImportSalesHistoryItem,
  ImportSkuItem,
  UpdateSalesHistoryDto,
  UpdateSkuDto,
  DeleteDataResult,
  ImportResult,
  SalesHistoryExportItem,
  SkuExportItem,
  TenantWithShopAndApiKey,
  UserWithRolesAndTenants,
  PeriodQuery,
  ShopContextParams,
} from '@sales-planner/shared';

export interface ClientConfig {
  baseUrl: string;
  apiKey: string;
}

export class SalesPlannerClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const text = await response.text();
    let message = response.statusText;
    if (text) {
      try {
        const error = JSON.parse(text);
        message = error.message || message;
      } catch {
        message = text;
      }
    }
    throw new ApiError(response.status, message || 'Request failed');
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string | number | undefined>;
    },
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    // Handle empty response body (e.g., void return type from NestJS)
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text);
  }

  private async requestText(
    method: string,
    path: string,
    options?: {
      params?: Record<string, string | number | undefined>;
    },
  ): Promise<string> {
    const url = new URL(this.baseUrl + path);

    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.text();
  }

  private async uploadCsv<T>(
    path: string,
    csvContent: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const formData = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('file', blob, 'upload.csv');

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json();
  }

  private async requestPublic<T>(method: string, path: string): Promise<T> {
    const url = new URL(this.baseUrl + path);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json();
  }

  private async requestTextPublic(method: string, path: string): Promise<string> {
    const url = new URL(this.baseUrl + path);

    const response = await fetch(url.toString(), { method });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.text();
  }

  // ============================================================
  // Me
  // ============================================================

  async getMe(): Promise<UserWithRolesAndTenants> {
    return this.request('GET', '/me');
  }

  // ============================================================
  // Users
  // ============================================================

  async getUsers(): Promise<User[]> {
    return this.request('GET', '/users');
  }

  async getUser(id: number): Promise<User> {
    return this.request('GET', `/users/${id}`);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.request('POST', '/users', { body: dto });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request('DELETE', `/users/${id}`);
  }

  // ============================================================
  // Tenants
  // ============================================================

  async getTenants(): Promise<Tenant[]> {
    return this.request('GET', '/tenants');
  }

  async getTenant(id: number): Promise<Tenant> {
    return this.request('GET', `/tenants/${id}`);
  }

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    return this.request('POST', '/tenants', { body: dto });
  }

  async createTenantWithShopAndUser(
    dto: CreateTenantWithShopDto,
  ): Promise<TenantWithShopAndApiKey> {
    return this.request('POST', '/tenants/with-shop-and-user', { body: dto });
  }

  async updateTenant(id: number, dto: Partial<CreateTenantDto>): Promise<Tenant> {
    return this.request('PUT', `/tenants/${id}`, { body: dto });
  }

  async deleteTenant(id: number): Promise<void> {
    return this.request('DELETE', `/tenants/${id}`);
  }

  // ============================================================
  // Shops
  // ============================================================

  async getShops(tenantId?: number): Promise<Shop[]> {
    return this.request('GET', '/shops', { params: { tenantId } });
  }

  async getShop(id: number): Promise<Shop> {
    return this.request('GET', `/shops/${id}`);
  }

  async createShop(dto: CreateShopDto): Promise<Shop> {
    return this.request('POST', '/shops', { body: dto });
  }

  async updateShop(id: number, dto: Partial<CreateShopDto>): Promise<Shop> {
    return this.request('PUT', `/shops/${id}`, { body: dto });
  }

  async deleteShop(id: number): Promise<void> {
    return this.request('DELETE', `/shops/${id}`);
  }

  async deleteShopData(id: number): Promise<DeleteDataResult> {
    return this.request('DELETE', `/shops/${id}/data`);
  }

  // ============================================================
  // SKUs
  // ============================================================

  async getSkus(ctx: ShopContextParams): Promise<Sku[]> {
    return this.request('GET', '/skus', { params: ctx });
  }

  async getSku(id: number, ctx: ShopContextParams): Promise<Sku> {
    return this.request('GET', `/skus/${id}`, { params: ctx });
  }

  async createSku(dto: CreateSkuRequest, ctx: ShopContextParams): Promise<Sku> {
    return this.request('POST', '/skus', { body: dto, params: ctx });
  }

  async updateSku(id: number, dto: UpdateSkuDto, ctx: ShopContextParams): Promise<Sku> {
    return this.request('PUT', `/skus/${id}`, { body: dto, params: ctx });
  }

  async deleteSku(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/skus/${id}`, { params: ctx });
  }

  async importSkusJson(items: ImportSkuItem[], ctx: ShopContextParams): Promise<ImportResult> {
    return this.request('POST', '/skus/import/json', { body: items, params: ctx });
  }

  async importSkusCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/skus/import/csv', csvContent, ctx);
  }

  async exportSkusJson(ctx: ShopContextParams): Promise<SkuExportItem[]> {
    return this.request('GET', '/skus/export/json', { params: ctx });
  }

  async exportSkusCsv(ctx: ShopContextParams): Promise<string> {
    return this.requestText('GET', '/skus/export/csv', { params: ctx });
  }

  async getSkusExampleJson(): Promise<ImportSkuItem[]> {
    return this.requestPublic('GET', '/skus/examples/json');
  }

  async getSkusExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/skus/examples/csv');
  }

  // ============================================================
  // Sales History
  // ============================================================

  async getSalesHistory(ctx: ShopContextParams, query?: PeriodQuery): Promise<SalesHistory[]> {
    return this.request('GET', '/sales-history', { params: { ...ctx, ...query } });
  }

  async getSalesHistoryItem(id: number, ctx: ShopContextParams): Promise<SalesHistory> {
    return this.request('GET', `/sales-history/${id}`, { params: ctx });
  }

  async createSalesHistory(
    dto: CreateSalesHistoryRequest,
    ctx: ShopContextParams,
  ): Promise<SalesHistory> {
    return this.request('POST', '/sales-history', { body: dto, params: ctx });
  }

  async updateSalesHistory(
    id: number,
    dto: UpdateSalesHistoryDto,
    ctx: ShopContextParams,
  ): Promise<SalesHistory> {
    return this.request('PUT', `/sales-history/${id}`, { body: dto, params: ctx });
  }

  async deleteSalesHistory(id: number, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/sales-history/${id}`, { params: ctx });
  }

  async importSalesHistoryJson(
    items: ImportSalesHistoryItem[],
    ctx: ShopContextParams,
  ): Promise<ImportResult> {
    return this.request('POST', '/sales-history/import/json', { body: items, params: ctx });
  }

  async importSalesHistoryCsv(csvContent: string, ctx: ShopContextParams): Promise<ImportResult> {
    return this.uploadCsv('/sales-history/import/csv', csvContent, ctx);
  }

  async exportSalesHistoryJson(
    ctx: ShopContextParams,
    query?: PeriodQuery,
  ): Promise<SalesHistoryExportItem[]> {
    return this.request('GET', '/sales-history/export/json', { params: { ...ctx, ...query } });
  }

  async exportSalesHistoryCsv(ctx: ShopContextParams, query?: PeriodQuery): Promise<string> {
    return this.requestText('GET', '/sales-history/export/csv', { params: { ...ctx, ...query } });
  }

  async getSalesHistoryExampleJson(): Promise<ImportSalesHistoryItem[]> {
    return this.requestPublic('GET', '/sales-history/examples/json');
  }

  async getSalesHistoryExampleCsv(): Promise<string> {
    return this.requestTextPublic('GET', '/sales-history/examples/csv');
  }

  // ============================================================
  // Roles
  // ============================================================

  async getRoles(): Promise<Role[]> {
    return this.request('GET', '/roles');
  }

  async getRole(id: number): Promise<Role> {
    return this.request('GET', `/roles/${id}`);
  }

  async createRole(dto: CreateRoleDto): Promise<Role> {
    return this.request('POST', '/roles', { body: dto });
  }

  async updateRole(id: number, dto: Partial<CreateRoleDto>): Promise<Role> {
    return this.request('PUT', `/roles/${id}`, { body: dto });
  }

  async deleteRole(id: number): Promise<void> {
    return this.request('DELETE', `/roles/${id}`);
  }

  // ============================================================
  // User Roles
  // ============================================================

  async createUserRole(dto: CreateUserRoleDto): Promise<void> {
    return this.request('POST', '/user-roles', { body: dto });
  }

  async deleteUserRole(id: number): Promise<void> {
    return this.request('DELETE', `/user-roles/${id}`);
  }

  // ============================================================
  // API Keys
  // ============================================================

  async getApiKeys(userId?: number): Promise<ApiKey[]> {
    return this.request('GET', '/api-keys', { params: { user_id: userId } });
  }

  async createApiKey(dto: CreateApiKeyDto): Promise<ApiKey> {
    return this.request('POST', '/api-keys', { body: dto });
  }

  async deleteApiKey(id: number): Promise<void> {
    return this.request('DELETE', `/api-keys/${id}`);
  }

  // ============================================================
  // Marketplaces
  // ============================================================

  async getMarketplaces(ctx: ShopContextParams): Promise<Marketplace[]> {
    return this.request('GET', '/marketplaces', { params: ctx });
  }

  async getMarketplace(id: string, ctx: ShopContextParams): Promise<Marketplace> {
    return this.request('GET', `/marketplaces/${id}`, { params: ctx });
  }

  async createMarketplace(
    dto: CreateMarketplaceRequest,
    ctx: ShopContextParams,
  ): Promise<Marketplace> {
    return this.request('POST', '/marketplaces', { body: dto, params: ctx });
  }

  async updateMarketplace(
    id: string,
    dto: Partial<CreateMarketplaceRequest>,
    ctx: ShopContextParams,
  ): Promise<Marketplace> {
    return this.request('PUT', `/marketplaces/${id}`, { body: dto, params: ctx });
  }

  async deleteMarketplace(id: string, ctx: ShopContextParams): Promise<void> {
    return this.request('DELETE', `/marketplaces/${id}`, { params: ctx });
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

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
