import type {
  CreateTenantDto as SharedCreateTenantDto,
  CreateTenantRequest as SharedCreateTenantRequest,
  CreateTenantWithShopDto as SharedCreateTenantWithShopDto,
  UpdateTenantDto as SharedUpdateTenantDto,
  UpdateTenantRequest as SharedUpdateTenantRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/index.js';

const { title, email, name, id } = zodSchemas;

// Request schemas (for HTTP layer)
export const CreateTenantRequestSchema = z.object({
  title: title(),
  owner_id: id().optional(),
});

// Zod schemas
export const CreateTenantSchema = z.object({
  title: title(),
  owner_id: id().optional(),
  created_by: id().optional(),
});

export const UpdateTenantSchema = z.object({
  title: title().optional(),
  owner_id: id().nullable().optional(),
});

export const CreateTenantWithShopSchema = z.object({
  tenantTitle: title(),
  shopTitle: title().optional(),
  userEmail: email(),
  userName: name(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateTenantRequest = AssertCompatible<
  SharedCreateTenantRequest,
  z.infer<typeof CreateTenantRequestSchema>
>;
export type CreateTenantDto = AssertCompatible<
  SharedCreateTenantDto,
  z.infer<typeof CreateTenantSchema>
>;
export type UpdateTenantDto = AssertCompatible<
  SharedUpdateTenantDto,
  z.infer<typeof UpdateTenantSchema>
>;
export type UpdateTenantRequest = AssertCompatible<
  SharedUpdateTenantRequest,
  z.infer<typeof UpdateTenantSchema>
>;
export type CreateTenantWithShopDto = AssertCompatible<
  SharedCreateTenantWithShopDto,
  z.infer<typeof CreateTenantWithShopSchema>
>;
