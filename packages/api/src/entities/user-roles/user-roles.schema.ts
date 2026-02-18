import type { CreateUserRoleDto as SharedCreateUserRoleDto } from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/index.js';

const { id } = zodSchemas;

// Zod schemas
export const CreateUserRoleSchema = z.object({
  userId: id(),
  roleId: id(),
  tenantId: id().optional(),
  shopId: id().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateUserRoleDto = AssertCompatible<
  SharedCreateUserRoleDto,
  z.infer<typeof CreateUserRoleSchema>
>;
