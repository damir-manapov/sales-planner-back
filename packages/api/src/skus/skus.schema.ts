import { z } from 'zod';
import type {
  CreateSkuDto as SharedCreateSkuDto,
  UpdateSkuDto as SharedUpdateSkuDto,
  ImportSkuItem as SharedImportSkuItem,
} from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { code, title, id } = zodSchemas;

// Zod schemas
export const CreateSkuSchema = z.object({
  code: code(),
  title: title(),
  shop_id: id(),
  tenant_id: id(),
});

export const UpdateSkuSchema = z.object({
  code: code().optional(),
  title: title().optional(),
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a SKU is created in a shop/tenant, it stays there
});

export const ImportSkuItemSchema = z.object({
  code: code(),
  title: title(),
});

// Infer TypeScript types from schemas
export type CreateSkuDto = AssertCompatible<SharedCreateSkuDto, z.infer<typeof CreateSkuSchema>>;
export type UpdateSkuDto = AssertCompatible<SharedUpdateSkuDto, z.infer<typeof UpdateSkuSchema>>;
export type ImportSkuItem = AssertCompatible<
  SharedImportSkuItem,
  z.infer<typeof ImportSkuItemSchema>
>;
