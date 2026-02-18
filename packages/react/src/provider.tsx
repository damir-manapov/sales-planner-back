import { createContext, useContext } from 'react';
import { SalesPlannerClient } from '@sales-planner/http-client';
import type { ClientConfig } from '@sales-planner/http-client';
export type { ClientConfig } from '@sales-planner/http-client';

const SalesPlannerContext = createContext<SalesPlannerClient | null>(null);

export interface SalesPlannerProviderProps {
  config: ClientConfig;
  children: React.ReactNode;
}

/**
 * Provides a SalesPlannerClient instance to all child components.
 * Must be used inside a TanStack QueryClientProvider.
 *
 * @example
 * ```tsx
 * import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 * import { SalesPlannerProvider } from '@sales-planner/react';
 *
 * const queryClient = new QueryClient();
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <SalesPlannerProvider config={{ baseUrl: '/api', apiKey: 'key' }}>
 *         <MyApp />
 *       </SalesPlannerProvider>
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export function SalesPlannerProvider({ config, children }: SalesPlannerProviderProps) {
  const client = new SalesPlannerClient(config);
  return <SalesPlannerContext value={client}>{children}</SalesPlannerContext>;
}

/**
 * Returns the SalesPlannerClient instance from context.
 * Must be used inside a SalesPlannerProvider.
 */
export function useSalesPlannerClient(): SalesPlannerClient {
  const client = useContext(SalesPlannerContext);
  if (!client) {
    throw new Error('useSalesPlannerClient must be used within a SalesPlannerProvider');
  }
  return client;
}
