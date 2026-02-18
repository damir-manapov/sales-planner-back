import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { PaginatedResponse, ShopContextParams } from '@sales-planner/shared';
import { useSalesPlannerClient } from './provider.js';
import { queryKeys, toShopContextParams } from './keys.js';
import type { ShopContext } from './keys.js';

type ShopScopedClientLike<TEntity, TCreate, TUpdate, TImport, TExport, TImportResult, TQuery> = {
  getAll(ctx: ShopContextParams, query?: TQuery): Promise<PaginatedResponse<TEntity>>;
  getById(ctx: ShopContextParams, id: number): Promise<TEntity>;
  create(ctx: ShopContextParams, request: TCreate): Promise<TEntity>;
  update(ctx: ShopContextParams, id: number, request: TUpdate): Promise<TEntity>;
  delete(ctx: ShopContextParams, id: number): Promise<void>;
  importJson(ctx: ShopContextParams, items: TImport[]): Promise<TImportResult>;
  importCsv(ctx: ShopContextParams, csvContent: string): Promise<TImportResult>;
  exportJson(ctx: ShopContextParams, query?: TQuery): Promise<TExport[]>;
  exportCsv(ctx: ShopContextParams, query?: TQuery): Promise<string>;
  getExampleJson(): Promise<TImport[]>;
  getExampleCsv(): Promise<string>;
};

/**
 * Creates a set of React Query hooks for a shop-scoped entity
 * (sales history, leftovers, seasonal coefficients, competitor entities)
 */
export function createShopScopedHooks<
  TEntity,
  TCreate,
  TUpdate,
  TImport,
  TExport,
  TImportResult,
  TQuery = Record<string, never>,
>(
  entityName: string,
  getClient: (
    client: ReturnType<typeof useSalesPlannerClient>,
  ) => ShopScopedClientLike<TEntity, TCreate, TUpdate, TImport, TExport, TImportResult, TQuery>,
) {
  function useList(
    ctx: ShopContext,
    query?: TQuery,
    options?: Omit<UseQueryOptions<PaginatedResponse<TEntity>>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityList(entityName, ctx, query as Record<string, unknown> | undefined),
      queryFn: () => getClient(client).getAll(toShopContextParams(ctx), query),
      ...options,
    });
  }

  function useById(
    ctx: ShopContext,
    id: number,
    options?: Omit<UseQueryOptions<TEntity>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityDetail(entityName, ctx, id),
      queryFn: () => getClient(client).getById(toShopContextParams(ctx), id),
      ...options,
    });
  }

  function useExportJson(
    ctx: ShopContext,
    query?: TQuery,
    options?: Omit<UseQueryOptions<TExport[]>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityExport(entityName, ctx, 'json'),
      queryFn: () => getClient(client).exportJson(toShopContextParams(ctx), query),
      enabled: false,
      ...options,
    });
  }

  function useExportCsv(
    ctx: ShopContext,
    query?: TQuery,
    options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityExport(entityName, ctx, 'csv'),
      queryFn: () => getClient(client).exportCsv(toShopContextParams(ctx), query),
      enabled: false,
      ...options,
    });
  }

  function useCreate(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<TEntity, Error, TCreate>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: TCreate) => getClient(client).create(toShopContextParams(ctx), request),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useUpdate(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<TEntity, Error, { id: number; data: TUpdate }>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: TUpdate }) =>
        getClient(client).update(toShopContextParams(ctx), id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useDelete(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => getClient(client).delete(toShopContextParams(ctx), id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useImportJson(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<TImportResult, Error, TImport[]>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (items: TImport[]) =>
        getClient(client).importJson(toShopContextParams(ctx), items),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useImportCsv(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<TImportResult, Error, string>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (csvContent: string) =>
        getClient(client).importCsv(toShopContextParams(ctx), csvContent),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useExampleJson(options?: Omit<UseQueryOptions<TImport[]>, 'queryKey' | 'queryFn'>) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityExample(entityName, 'json'),
      queryFn: () => getClient(client).getExampleJson(),
      staleTime: Number.POSITIVE_INFINITY,
      ...options,
    });
  }

  function useExampleCsv(options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityExample(entityName, 'csv'),
      queryFn: () => getClient(client).getExampleCsv(),
      staleTime: Number.POSITIVE_INFINITY,
      ...options,
    });
  }

  return {
    useList,
    useById,
    useExportJson,
    useExportCsv,
    useExampleJson,
    useExampleCsv,
    useCreate,
    useUpdate,
    useDelete,
    useImportJson,
    useImportCsv,
  };
}
