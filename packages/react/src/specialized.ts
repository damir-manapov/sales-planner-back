import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type {
  UserWithRolesAndTenants,
  EntitiesMetadata,
  PaginatedResponse,
  PaginationQuery,
  SkuMetrics,
} from '@sales-planner/shared';
import { useSalesPlannerClient } from './provider.js';
import { queryKeys } from './keys.js';
import type { ShopContext } from './keys.js';

/** Info about a materialized view */
export interface ViewInfo {
  name: string;
  description: string;
}

/** Result of refreshing all materialized views */
export interface RefreshAllResult {
  results: Array<{ view: string; duration: number; success: boolean; error?: string }>;
  totalDuration: number;
  success: boolean;
}

// ── Me ──

export function useMe(
  options?: Omit<UseQueryOptions<UserWithRolesAndTenants>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => client.me.getMe(),
    ...options,
  });
}

// ── Metadata ──

export function useEntitiesMetadata(
  options?: Omit<UseQueryOptions<EntitiesMetadata>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.metadata(),
    queryFn: () => client.metadata.getEntitiesMetadata(),
    staleTime: Number.POSITIVE_INFINITY, // metadata rarely changes
    ...options,
  });
}

// ── SKU Metrics ──

export function useSkuMetrics(
  ctx: ShopContext,
  query?: PaginationQuery,
  options?: Omit<UseQueryOptions<PaginatedResponse<SkuMetrics>>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.skuMetricsList(ctx, query as Record<string, unknown> | undefined),
    queryFn: () => client.skuMetrics.list(ctx, query),
    ...options,
  });
}

export function useSkuMetricsById(
  ctx: ShopContext,
  id: number,
  options?: Omit<UseQueryOptions<SkuMetrics>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.skuMetricsDetail(ctx, id),
    queryFn: () => client.skuMetrics.get(ctx, id),
    ...options,
  });
}

export function useSkuMetricsByAbcClass(
  ctx: ShopContext,
  abcClass: 'A' | 'B' | 'C',
  options?: Omit<UseQueryOptions<SkuMetrics[]>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: queryKeys.skuMetricsAbc(ctx, abcClass),
    queryFn: () => client.skuMetrics.getByAbcClass(ctx, abcClass),
    ...options,
  });
}

export function useSkuMetricsExportCsv(
  ctx: ShopContext,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: [...queryKeys.skuMetrics(ctx), 'export', 'csv'] as const,
    queryFn: () => client.skuMetrics.exportCsv(ctx),
    enabled: false,
    ...options,
  });
}

// ── Computed Entities (Materialized Views) ──

export function useComputedViews(
  ctx: ShopContext,
  options?: Omit<UseQueryOptions<ViewInfo[]>, 'queryKey' | 'queryFn'>,
) {
  const client = useSalesPlannerClient();
  return useQuery({
    queryKey: [...queryKeys.computed(ctx), 'views'] as const,
    queryFn: () => client.computed.getViews(ctx),
    ...options,
  });
}

export function useRefreshAllViews(
  ctx: ShopContext,
  options?: Omit<UseMutationOptions<RefreshAllResult, Error, void>, 'mutationFn'>,
) {
  const client = useSalesPlannerClient();
  const queryClient = useQueryClient();
  return useMutation<RefreshAllResult, Error, void>({
    mutationFn: () => client.computed.refreshAll(ctx),
    onSuccess: () => {
      // Refresh sku-metrics cache since views were refreshed
      queryClient.invalidateQueries({ queryKey: queryKeys.skuMetrics(ctx) });
    },
    ...options,
  });
}
