import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type {
  PaginatedResponse,
  PaginationQuery,
  ImportResult,
  ShopContextParams,
} from '@sales-planner/shared';
import { useSalesPlannerClient } from './provider.js';
import { queryKeys } from './keys.js';
import type { ShopContext } from './keys.js';

type CodedEntityClientLike<TEntity, TCreate, TUpdate, TImport, TExport> = {
  getAll(ctx: ShopContextParams, query?: PaginationQuery): Promise<PaginatedResponse<TEntity>>;
  getById(ctx: ShopContextParams, id: number): Promise<TEntity>;
  getByCode(ctx: ShopContextParams, code: string): Promise<TEntity>;
  create(ctx: ShopContextParams, request: TCreate): Promise<TEntity>;
  update(ctx: ShopContextParams, id: number, request: TUpdate): Promise<TEntity>;
  delete(ctx: ShopContextParams, id: number): Promise<void>;
  importJson(ctx: ShopContextParams, items: TImport[]): Promise<ImportResult>;
  importCsv(ctx: ShopContextParams, csvContent: string): Promise<ImportResult>;
  exportJson(ctx: ShopContextParams): Promise<TExport[]>;
  exportCsv(ctx: ShopContextParams): Promise<string>;
  getExampleJson(): Promise<TImport[]>;
  getExampleCsv(): Promise<string>;
};

/**
 * Creates a set of React Query hooks for a coded entity (brands, categories, etc.)
 */
export function createCodedEntityHooks<TEntity, TCreate, TUpdate, TImport, TExport>(
  entityName: string,
  getClient: (
    client: ReturnType<typeof useSalesPlannerClient>,
  ) => CodedEntityClientLike<TEntity, TCreate, TUpdate, TImport, TExport>,
) {
  function useList(
    ctx: ShopContext,
    query?: PaginationQuery,
    options?: Omit<UseQueryOptions<PaginatedResponse<TEntity>>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityList(entityName, ctx, query as Record<string, unknown> | undefined),
      queryFn: () => getClient(client).getAll(ctx, query),
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
      queryFn: () => getClient(client).getById(ctx, id),
      ...options,
    });
  }

  function useByCode(
    ctx: ShopContext,
    code: string,
    options?: Omit<UseQueryOptions<TEntity>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityByCode(entityName, ctx, code),
      queryFn: () => getClient(client).getByCode(ctx, code),
      ...options,
    });
  }

  function useExportJson(
    ctx: ShopContext,
    options?: Omit<UseQueryOptions<TExport[]>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityExport(entityName, ctx, 'json'),
      queryFn: () => getClient(client).exportJson(ctx),
      enabled: false, // manual trigger only
      ...options,
    });
  }

  function useExportCsv(
    ctx: ShopContext,
    options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>,
  ) {
    const client = useSalesPlannerClient();
    return useQuery({
      queryKey: queryKeys.entityExport(entityName, ctx, 'csv'),
      queryFn: () => getClient(client).exportCsv(ctx),
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
      mutationFn: (request: TCreate) => getClient(client).create(ctx, request),
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
        getClient(client).update(ctx, id, data),
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
      mutationFn: (id: number) => getClient(client).delete(ctx, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useImportJson(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<ImportResult, Error, TImport[]>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (items: TImport[]) => getClient(client).importJson(ctx, items),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.entity(entityName, ctx) });
      },
      ...options,
    });
  }

  function useImportCsv(
    ctx: ShopContext,
    options?: Omit<UseMutationOptions<ImportResult, Error, string>, 'mutationFn'>,
  ) {
    const client = useSalesPlannerClient();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (csvContent: string) => getClient(client).importCsv(ctx, csvContent),
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
    useByCode,
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
