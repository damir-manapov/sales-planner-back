import { z } from 'zod';
import type { CreateUserDto as SharedCreateUserDto } from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { email, name, id } = zodSchemas;

// Zod schemas
export const CreateUserSchema = z.object({
  email: email(),
  name: name(),
  default_shop_id: id().optional(),
});

export const UpdateUserSchema = z.object({
  email: email().optional(),
  name: name().optional(),
  default_shop_id: id().nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateUserDto = AssertCompatible<SharedCreateUserDto, z.infer<typeof CreateUserSchema>>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
