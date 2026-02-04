import { z } from 'zod';
import type {
  CreateTenantDto as SharedCreateTenantDto,
  CreateTenantWithShopDto as SharedCreateTenantWithShopDto,
} from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { title, email, name, id } = zodSchemas;

// Zod schemas
export const CreateTenantSchema = z.object({
  title: title(),
  owner_id: id().optional(),
  created_by: id(),
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
export type CreateTenantDto = AssertCompatible<SharedCreateTenantDto, z.infer<typeof CreateTenantSchema>>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
export type CreateTenantWithShopDto = AssertCompatible<SharedCreateTenantWithShopDto, z.infer<typeof CreateTenantWithShopSchema>>;
