import { z } from 'zod';
import type { CreateUserRoleDto as SharedCreateUserRoleDto } from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { id } = zodSchemas;

// Zod schemas
export const CreateUserRoleSchema = z.object({
  user_id: id(),
  role_id: id(),
  tenant_id: id().optional(),
  shop_id: id().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateUserRoleDto = AssertCompatible<
  SharedCreateUserRoleDto,
  z.infer<typeof CreateUserRoleSchema>
>;
