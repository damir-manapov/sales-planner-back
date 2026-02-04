import { z } from 'zod';
import type { CreateRoleDto as SharedCreateRoleDto } from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { code, description } = zodSchemas;

// Zod schemas
export const CreateRoleSchema = z.object({
  name: code(), // role names are short codes (1-100 chars)
  description: description().optional(),
});

export const UpdateRoleSchema = z.object({
  name: code().optional(),
  description: description().nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateRoleDto = AssertCompatible<SharedCreateRoleDto, z.infer<typeof CreateRoleSchema>>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
