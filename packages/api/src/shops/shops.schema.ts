import { z } from 'zod';
import type {
  CreateShopRequest as SharedCreateShopRequest,
  CreateShopDto as SharedCreateShopDto,
  UpdateShopRequest as SharedUpdateShopRequest,
  UpdateShopDto as SharedUpdateShopDto,
} from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { title, id } = zodSchemas;

// Zod schemas
export const CreateShopSchema = z.object({
  title: title(),
  tenant_id: id(),
});

export const UpdateShopSchema = z.object({
  title: title().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateShopRequest = AssertCompatible<
  SharedCreateShopRequest,
  z.infer<typeof CreateShopSchema>
>;
export type CreateShopDto = AssertCompatible<SharedCreateShopDto, z.infer<typeof CreateShopSchema>>;
export type UpdateShopDto = AssertCompatible<SharedUpdateShopDto, z.infer<typeof UpdateShopSchema>>;
export type UpdateShopRequest = AssertCompatible<
  SharedUpdateShopRequest,
  z.infer<typeof UpdateShopSchema>
>;
