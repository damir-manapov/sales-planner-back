import { z } from 'zod';

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
export type CreateSkuDto = z.infer<typeof CreateSkuSchema>;
export type UpdateSkuDto = z.infer<typeof UpdateSkuSchema>;
export type ImportSkuItem = z.infer<typeof ImportSkuItemSchema>;
