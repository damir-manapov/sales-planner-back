export type FieldType = 'string' | 'number' | 'date' | 'period';

export interface EntityFieldMetadata {
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  example?: string;
}

export interface EntityMetadata {
  name: string;
  description: string;
  fields: EntityFieldMetadata[];
}

export interface EntitiesMetadata {
  brands: EntityMetadata;
  categories: EntityMetadata;
  groups: EntityMetadata;
  statuses: EntityMetadata;
  suppliers: EntityMetadata;
  warehouses: EntityMetadata;
  marketplaces: EntityMetadata;
  skus: EntityMetadata;
  salesHistory: EntityMetadata;
  leftovers: EntityMetadata;
  seasonalCoefficients: EntityMetadata;
  competitorProducts: EntityMetadata;
  skuCompetitorMappings: EntityMetadata;
  competitorSales: EntityMetadata;
}

export const ENTITIES_METADATA: EntitiesMetadata = {
  brands: {
    name: 'Brands',
    description: 'Product brands managed by your shop',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique brand identifier',
        required: true,
        example: 'apple',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Brand display name',
        required: true,
        example: 'Apple Inc.',
      },
    ],
  },
  categories: {
    name: 'Categories',
    description: 'Product categories for classification',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique category identifier',
        required: true,
        example: 'electronics',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Category display name',
        required: true,
        example: 'Electronics',
      },
    ],
  },
  groups: {
    name: 'Groups',
    description: 'Product groups for classification',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique group identifier',
        required: true,
        example: 'smartphones',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Group display name',
        required: true,
        example: 'Smartphones',
      },
    ],
  },
  statuses: {
    name: 'Statuses',
    description: 'Product statuses for classification',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique status identifier',
        required: true,
        example: 'active',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Status display name',
        required: true,
        example: 'Active',
      },
    ],
  },
  suppliers: {
    name: 'Suppliers',
    description: 'Product suppliers and vendors',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique supplier identifier',
        required: true,
        example: 'acme-corp',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Supplier display name',
        required: true,
        example: 'ACME Corporation',
      },
    ],
  },
  warehouses: {
    name: 'Warehouses',
    description: 'Storage locations for inventory',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique warehouse identifier',
        required: true,
        example: 'main-warehouse',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Warehouse display name',
        required: true,
        example: 'Main Warehouse',
      },
    ],
  },
  marketplaces: {
    name: 'Marketplaces',
    description: 'Sales channels where products are sold',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique marketplace identifier',
        required: true,
        example: 'amazon',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Marketplace display name',
        required: true,
        example: 'Amazon',
      },
    ],
  },
  skus: {
    name: 'Products',
    description: 'Product catalog items (SKUs)',
    fields: [
      {
        name: 'code',
        type: 'string',
        description: 'Unique product SKU code',
        required: true,
        example: 'IPHONE-15-PRO',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Product display name',
        required: true,
        example: 'iPhone 15 Pro',
      },
      {
        name: 'category',
        type: 'string',
        description: 'Product category code (auto-creates if missing)',
        required: false,
        example: 'electronics',
      },
      {
        name: 'group',
        type: 'string',
        description: 'Product group code (auto-creates if missing)',
        required: false,
        example: 'smartphones',
      },
      {
        name: 'status',
        type: 'string',
        description: 'Product status code (auto-creates if missing)',
        required: false,
        example: 'active',
      },
      {
        name: 'supplier',
        type: 'string',
        description: 'Product supplier code (auto-creates if missing)',
        required: false,
        example: 'apple-inc',
      },
    ],
  },
  salesHistory: {
    name: 'Sales History',
    description: 'Historical sales data by SKU, period, and marketplace',
    fields: [
      {
        name: 'marketplace',
        type: 'string',
        description: 'Marketplace code where sales occurred',
        required: true,
        example: 'amazon',
      },
      {
        name: 'period',
        type: 'period',
        description: 'Sales period in YYYY-MM format',
        required: true,
        example: '2024-01',
      },
      {
        name: 'sku',
        type: 'string',
        description: 'Product SKU code',
        required: true,
        example: 'IPHONE-15-PRO',
      },
      {
        name: 'quantity',
        type: 'number',
        description: 'Number of units sold',
        required: true,
        example: '150',
      },
    ],
  },
  leftovers: {
    name: 'Leftovers',
    description: 'Inventory levels by warehouse, SKU, and period',
    fields: [
      {
        name: 'warehouse',
        type: 'string',
        description: 'Warehouse code',
        required: true,
        example: 'main-warehouse',
      },
      {
        name: 'sku',
        type: 'string',
        description: 'Product SKU code',
        required: true,
        example: 'IPHONE-15-PRO',
      },
      {
        name: 'period',
        type: 'period',
        description: 'Inventory period in YYYY-MM format',
        required: true,
        example: '2024-01',
      },
      {
        name: 'quantity',
        type: 'number',
        description: 'Number of units in stock',
        required: true,
        example: '500',
      },
    ],
  },
  seasonalCoefficients: {
    name: 'Seasonal Coefficients',
    description: 'Monthly demand multipliers by product group',
    fields: [
      {
        name: 'group',
        type: 'string',
        description: 'Product group code',
        required: true,
        example: 'smartphones',
      },
      {
        name: 'month',
        type: 'number',
        description: 'Month number (1-12)',
        required: true,
        example: '12',
      },
      {
        name: 'coefficient',
        type: 'number',
        description: 'Demand multiplier (1.0 = normal, 1.5 = 50% higher)',
        required: true,
        example: '1.25',
      },
    ],
  },
  competitorProducts: {
    name: 'Competitor Products',
    description: 'Competitor product catalog with marketplace product IDs',
    fields: [
      {
        name: 'marketplace',
        type: 'string',
        description: 'Marketplace code',
        required: true,
        example: 'ozon',
      },
      {
        name: 'marketplace_product_id',
        type: 'string',
        description: 'Product ID on the marketplace (numeric string)',
        required: true,
        example: '1628467935',
      },
      {
        name: 'title',
        type: 'string',
        description: 'Product title',
        required: false,
        example: 'Фильтр салонный',
      },
      {
        name: 'brand',
        type: 'string',
        description: 'Product brand',
        required: false,
        example: 'mavyko',
      },
    ],
  },
  skuCompetitorMappings: {
    name: 'SKU Competitor Mappings',
    description: 'Mappings between your SKUs and competitor product codes',
    fields: [
      {
        name: 'sku',
        type: 'string',
        description: 'Your product SKU code',
        required: true,
        example: 'IPHONE-15-PRO',
      },
      {
        name: 'marketplace',
        type: 'string',
        description: 'Marketplace code',
        required: true,
        example: 'ozon',
      },
      {
        name: 'marketplace_product_id',
        type: 'string',
        description: 'Product ID on the marketplace (numeric string)',
        required: true,
        example: '1628467935',
      },
    ],
  },
  competitorSales: {
    name: 'Competitor Sales',
    description: 'Competitor sales data by marketplace and product',
    fields: [
      {
        name: 'marketplace',
        type: 'string',
        description: 'Marketplace code',
        required: true,
        example: 'ozon',
      },
      {
        name: 'marketplace_product_id',
        type: 'string',
        description: 'Product ID on the marketplace (numeric string)',
        required: true,
        example: '1628467935',
      },
      {
        name: 'period',
        type: 'period',
        description: 'Sales period in YYYY-MM format',
        required: true,
        example: '2024-01',
      },
      {
        name: 'quantity',
        type: 'number',
        description: 'Number of units sold',
        required: true,
        example: '250',
      },
    ],
  },
};
