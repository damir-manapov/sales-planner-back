import { z } from 'zod';
import type {
  CreateTenantDto as SharedCreateTenantDto,
  CreateTenantWithShopDto as SharedCreateTenantWithShopDto,
} from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateTenantSchema = z.object({
  title: z.string().min(1).max(255),
  owner_id: z.number().int().positive().optional(),
  created_by: z.number().int().positive(),
});

export const UpdateTenantSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  owner_id: z.number().int().positive().nullable().optional(),
});

export const CreateTenantWithShopSchema = z.object({
  tenantTitle: z.string().min(1).max(255),
  shopTitle: z.string().min(1).max(255).optional(),
  userEmail: z.string().email().max(255),
  userName: z.string().min(1).max(255),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateTenantDto = AssertCompatible<SharedCreateTenantDto, z.infer<typeof CreateTenantSchema>>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
export type CreateTenantWithShopDto = AssertCompatible<SharedCreateTenantWithShopDto, z.infer<typeof CreateTenantWithShopSchema>>;
