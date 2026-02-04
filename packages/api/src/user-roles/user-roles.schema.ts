import { z } from 'zod';
import type { CreateUserRoleDto as SharedCreateUserRoleDto } from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateUserRoleSchema = z.object({
  user_id: z.number().int().positive(),
  role_id: z.number().int().positive(),
  tenant_id: z.number().int().positive().optional(),
  shop_id: z.number().int().positive().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateUserRoleDto = AssertCompatible<SharedCreateUserRoleDto, z.infer<typeof CreateUserRoleSchema>>;
