import type {
  CreateBrandDto as SharedCreateBrandDto,
  CreateBrandRequest as SharedCreateBrandRequest,
  ImportBrandItem as SharedImportBrandItem,
  UpdateBrandDto as SharedUpdateBrandDto,
  UpdateBrandRequest as SharedUpdateBrandRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/index.js';

const { code, title } = zodSchemas;

// Zod schemas
// Note: shop_id and tenant_id are injected from ShopContext, not from request body
export const CreateBrandSchema = z.object({
  code: code(),
  title: title(),
});

export const UpdateBrandSchema = z.object({
  code: code().optional(),
  title: title().optional(),
  // Note: shop_id and tenant_id are intentionally not updatable
  // Once a brand is created in a shop/tenant, it stays there
});

export const ImportBrandItemSchema = z.object({
  code: code(),
  title: title(),
});

// TypeScript types
export type CreateBrandRequest = AssertCompatible<
  SharedCreateBrandRequest,
  z.infer<typeof CreateBrandSchema>
>;
export type CreateBrandDto = AssertCompatible<
  SharedCreateBrandDto,
  Omit<SharedCreateBrandDto, never>
>;
export type UpdateBrandDto = AssertCompatible<
  SharedUpdateBrandDto,
  z.infer<typeof UpdateBrandSchema>
>;
export type UpdateBrandRequest = AssertCompatible<
  SharedUpdateBrandRequest,
  z.infer<typeof UpdateBrandSchema>
>;
export type ImportBrandItem = AssertCompatible<
  SharedImportBrandItem,
  z.infer<typeof ImportBrandItemSchema>
>;
