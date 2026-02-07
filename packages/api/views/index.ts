/**
 * Materialized Views Registry
 *
 * This file contains the registry of all materialized views in the system.
 * Views should be listed in dependency order (views with no dependencies first).
 *
 * Each view entry contains:
 * - name: The view name (must match the SQL file and actual view name)
 * - file: Path to the SQL file containing CREATE MATERIALIZED VIEW
 * - dependencies: Array of view names that must be created/refreshed first
 */

import * as path from 'path';

export interface MaterializedViewDefinition {
  /** Name of the materialized view (must match SQL view name) */
  name: string;
  /** Path to the SQL file relative to views/ folder */
  file: string;
  /** Names of other materialized views this depends on */
  dependencies: string[];
  /** Human-readable description */
  description: string;
}

/**
 * List of all materialized views in dependency order.
 * Views are applied in this order, and refreshed in this order.
 */
export const MATERIALIZED_VIEWS: MaterializedViewDefinition[] = [
  {
    name: 'mv_sku_metrics',
    file: 'mv_sku_metrics.sql',
    dependencies: [], // Depends only on base tables: skus, sales_history, leftovers, etc.
    description: 'SKU metrics including last period sales, stock levels, ABC classification',
  },
];

/**
 * Get the full path to a view's SQL file
 */
export function getViewPath(viewDef: MaterializedViewDefinition): string {
  return path.join(__dirname, viewDef.file);
}

/**
 * Get views in topologically sorted order (respecting dependencies)
 */
export function getViewsInOrder(): MaterializedViewDefinition[] {
  const result: MaterializedViewDefinition[] = [];
  const visited = new Set<string>();

  function visit(view: MaterializedViewDefinition) {
    if (visited.has(view.name)) return;
    visited.add(view.name);

    // Visit dependencies first
    for (const depName of view.dependencies) {
      const dep = MATERIALIZED_VIEWS.find((v) => v.name === depName);
      if (dep) {
        visit(dep);
      } else {
        throw new Error(
          `Materialized view "${view.name}" depends on unknown view "${depName}"`,
        );
      }
    }

    result.push(view);
  }

  for (const view of MATERIALIZED_VIEWS) {
    visit(view);
  }

  return result;
}

/**
 * Get views in reverse order (for dropping)
 */
export function getViewsInReverseOrder(): MaterializedViewDefinition[] {
  return getViewsInOrder().reverse();
}
