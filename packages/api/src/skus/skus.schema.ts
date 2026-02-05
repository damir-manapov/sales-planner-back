import type {
  CreateSkuDto as SharedCreateSkuDto,
  CreateSkuRequest as SharedCreateSkuRequest,
  ImportSkuItem as SharedImportSkuItem,
  UpdateSkuDto as SharedUpdateSkuDto,
  UpdateSkuRequest as SharedUpdateSkuRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { code, title } = zodSchemas;

// Zod schemas
// Note: shop_id and tenant_id are injected from ShopContext, not from request body
// Create/Update use numeric IDs; codes are only for import/export
export const CreateSkuSchema = z.object({
  code: code(),
  title: title(),
  title2: z.string().optional(),
  category_id: z.number().optional(),
  group_id: z.number().optional(),
  status_id: z.number().optional(),
  supplier_id: z.number().optional(),
});

export const UpdateSkuSchema = z.object({
  code: code().optional(),
  title: title().optional(),
  title2: z.string().optional(),
  category_id: z.number().optional(),
  group_id: z.number().optional(),
  status_id: z.number().optional(),
  supplier_id: z.number().optional(),
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a SKU is created in a shop/tenant, it stays there
});

export const ImportSkuItemSchema = z.object({
  code: code(),
  title: title(),
  title2: z.string().optional(),
  category: z.string().optional(),
  group: z.string().optional(),
  status: z.string().optional(),
  supplier: z.string().optional(),
});

// TypeScript types
export type CreateSkuRequest = AssertCompatible<
  SharedCreateSkuRequest,
  z.infer<typeof CreateSkuSchema>
>;
export type CreateSkuDto = AssertCompatible<SharedCreateSkuDto, Omit<SharedCreateSkuDto, never>>;
export type UpdateSkuDto = AssertCompatible<SharedUpdateSkuDto, z.infer<typeof UpdateSkuSchema>>;
export type UpdateSkuRequest = AssertCompatible<
  SharedUpdateSkuRequest,
  z.infer<typeof UpdateSkuSchema>
>;
export type ImportSkuItem = AssertCompatible<
  SharedImportSkuItem,
  z.infer<typeof ImportSkuItemSchema>
>;
