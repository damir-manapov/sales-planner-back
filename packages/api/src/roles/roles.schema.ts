import { z } from 'zod';
import type { CreateRoleDto as SharedCreateRoleDto } from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateRoleDto = AssertCompatible<SharedCreateRoleDto, z.infer<typeof CreateRoleSchema>>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
