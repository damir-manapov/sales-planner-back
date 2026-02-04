import { z } from 'zod';
import type { CreateShopDto as SharedCreateShopDto } from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateShopSchema = z.object({
  title: z.string().min(1).max(255),
  tenant_id: z.number().int().positive(),
});

export const UpdateShopSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateShopDto = AssertCompatible<SharedCreateShopDto, z.infer<typeof CreateShopSchema>>;
export type UpdateShopDto = z.infer<typeof UpdateShopSchema>;
