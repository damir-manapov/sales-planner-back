import { z } from 'zod';
import type {
  CreateSkuDto as SharedCreateSkuDto,
  UpdateSkuDto as SharedUpdateSkuDto,
  ImportSkuItem as SharedImportSkuItem,
} from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateSkuSchema = z.object({
  code: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  shop_id: z.number().int().positive(),
  tenant_id: z.number().int().positive(),
});

export const UpdateSkuSchema = z.object({
  code: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(255).optional(),
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a SKU is created in a shop/tenant, it stays there
});

export const ImportSkuItemSchema = z.object({
  code: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
});

// Infer TypeScript types from schemas
export type CreateSkuDto = AssertCompatible<SharedCreateSkuDto, z.infer<typeof CreateSkuSchema>>;
export type UpdateSkuDto = AssertCompatible<SharedUpdateSkuDto, z.infer<typeof UpdateSkuSchema>>;
export type ImportSkuItem = AssertCompatible<SharedImportSkuItem, z.infer<typeof ImportSkuItemSchema>>;
