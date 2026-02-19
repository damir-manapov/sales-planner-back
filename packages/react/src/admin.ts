import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type {
  Tenant,
  CreateTenantRequest,
  UpdateTenantRequest,
  CreateTenantWithShopRequest,
  TenantWithShopAndApiKey,
  PaginatedResponse,
  PaginationQuery,
  User,
  CreateUserRequest,
  Shop,
  CreateShopRequest,
  UpdateShopRequest,
  Role,
  UserRoleResponse,
  CreateUserRoleRequest,
  GetUserRolesQuery,
  ApiKey,
  CreateApiKeyRequest,
} from '@sales-planner/shared';
import { useSalesPlannerClient } from './provider.js';
import { queryKeys } from './keys.js';

// ── Tenants ──

interface GetTenantsQuery extends PaginationQuery {
  ownerId?: number;
}

export function useTenants(
  query?: GetTenantsQuery,
  options?: Omit<UseQueryOptions<PaginatedResponse<Tenant>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.tenants(query as Record<string, unknown> | undefined),
    queryFn: () => client.tenants.getAll(query),
    ...options,
  });
}

export function useTenantById(
  id: number,
  options?: Omit<UseQueryOptions<Tenant>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.tenantDetail(id),
    queryFn: () => client.tenants.getById(id),
    ...options,
  });
}

export function useCreateTenant(
  options?: Omit<UseMutationOptions<Tenant, Error, CreateTenantRequest>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTenantRequest) => client.tenants.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'tenants'] });
    },
    ...options,
  });
}

export function useCreateTenantWithShopAndUser(
  options?: Omit<
    UseMutationOptions<TenantWithShopAndApiKey, Error, CreateTenantWithShopRequest>,
    'mutationFn'
  >,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateTenantWithShopRequest) =>
      client.tenants.createWithShopAndUser(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['sales-planner', 'shops'] });
      qc.invalidateQueries({ queryKey: ['sales-planner', 'users'] });
      qc.invalidateQueries({ queryKey: ['sales-planner', 'api-keys'] });
    },
    ...options,
  });
}

export function useUpdateTenant(
  options?: Omit<
    UseMutationOptions<Tenant, Error, { id: number; data: UpdateTenantRequest }>,
    'mutationFn'
  >,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTenantRequest }) =>
      client.tenants.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'tenants'] });
    },
    ...options,
  });
}

export function useDeleteTenant(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.tenants.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'tenants'] });
    },
    ...options,
  });
}

// ── Users ──

interface GetUsersQuery extends PaginationQuery {
  tenantId?: number;
}

export function useUsers(
  query?: GetUsersQuery,
  options?: Omit<UseQueryOptions<PaginatedResponse<User>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.users(query as Record<string, unknown> | undefined),
    queryFn: () => client.users.getAll(query),
    ...options,
  });
}

export function useUserById(
  id: number,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.userDetail(id),
    queryFn: () => client.users.getById(id),
    ...options,
  });
}

export function useCreateUser(
  options?: Omit<UseMutationOptions<User, Error, CreateUserRequest>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateUserRequest) => client.users.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'users'] });
    },
    ...options,
  });
}

export function useDeleteUser(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.users.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'users'] });
    },
    ...options,
  });
}

// ── Shops ──

interface GetShopsQuery extends PaginationQuery {
  tenantId?: number;
}

export function useShops(
  query?: GetShopsQuery,
  options?: Omit<UseQueryOptions<PaginatedResponse<Shop>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.shops(query as Record<string, unknown> | undefined),
    queryFn: () => client.shops.getAll(query),
    ...options,
  });
}

export function useShopById(
  id: number,
  options?: Omit<UseQueryOptions<Shop>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.shopDetail(id),
    queryFn: () => client.shops.getById(id),
    ...options,
  });
}

export function useCreateShop(
  options?: Omit<UseMutationOptions<Shop, Error, CreateShopRequest>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateShopRequest) => client.shops.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'shops'] });
    },
    ...options,
  });
}

export function useUpdateShop(
  options?: Omit<
    UseMutationOptions<Shop, Error, { id: number; data: UpdateShopRequest }>,
    'mutationFn'
  >,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShopRequest }) =>
      client.shops.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'shops'] });
    },
    ...options,
  });
}

// ── Roles ──

export function useRoles(
  query?: PaginationQuery,
  options?: Omit<UseQueryOptions<PaginatedResponse<Role>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.roles(query as Record<string, unknown> | undefined),
    queryFn: () => client.roles.getAll(query),
    ...options,
  });
}

export function useRoleById(
  id: number,
  options?: Omit<UseQueryOptions<Role>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.roleDetail(id),
    queryFn: () => client.roles.getById(id),
    ...options,
  });
}

// ── User Roles ──

interface GetUserRolesQueryWithPagination extends GetUserRolesQuery, PaginationQuery {}

export function useUserRoles(
  query?: GetUserRolesQueryWithPagination,
  options?: Omit<UseQueryOptions<PaginatedResponse<UserRoleResponse>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.userRoles(query as Record<string, unknown> | undefined),
    queryFn: () => client.userRoles.getAll(query),
    ...options,
  });
}

export function useUserRoleById(
  id: number,
  options?: Omit<UseQueryOptions<UserRoleResponse>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.userRoleDetail(id),
    queryFn: () => client.userRoles.getById(id),
    ...options,
  });
}

export function useCreateUserRole(
  options?: Omit<UseMutationOptions<UserRoleResponse, Error, CreateUserRoleRequest>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateUserRoleRequest) => client.userRoles.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'user-roles'] });
    },
    ...options,
  });
}

export function useDeleteUserRole(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.userRoles.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'user-roles'] });
    },
    ...options,
  });
}

// ── API Keys ──

interface GetApiKeysQuery extends PaginationQuery {
  userId?: number;
}

export function useApiKeys(
  query?: GetApiKeysQuery,
  options?: Omit<UseQueryOptions<PaginatedResponse<ApiKey>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.apiKeys(query as Record<string, unknown> | undefined),
    queryFn: () => client.apiKeys.getAll(query),
    ...options,
  });
}

export function useCreateApiKey(
  options?: Omit<UseMutationOptions<ApiKey, Error, CreateApiKeyRequest>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateApiKeyRequest) => client.apiKeys.create(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'api-keys'] });
    },
    ...options,
  });
}

export function useRevokeApiKey(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client.apiKeys.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-planner', 'api-keys'] });
    },
    ...options,
  });
}
