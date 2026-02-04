import { z } from 'zod';
import type { CreateUserDto as SharedCreateUserDto } from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(255),
  default_shop_id: z.number().int().positive().optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  name: z.string().min(1).max(255).optional(),
  default_shop_id: z.number().int().positive().nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateUserDto = AssertCompatible<SharedCreateUserDto, z.infer<typeof CreateUserSchema>>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
