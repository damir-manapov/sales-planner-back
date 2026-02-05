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
  marketplaces: EntityMetadata;
  skus: EntityMetadata;
  salesHistory: EntityMetadata;
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
        name: 'category_code',
        type: 'string',
        description: 'Product category code',
        required: false,
        example: 'electronics',
      },
      {
        name: 'group_code',
        type: 'string',
        description: 'Product group code',
        required: false,
        example: 'smartphones',
      },
      {
        name: 'status_code',
        type: 'string',
        description: 'Product status code',
        required: false,
        example: 'active',
      },
      {
        name: 'supplier_code',
        type: 'string',
        description: 'Product supplier code',
        required: false,
        example: 'acme-corp',
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
};
