import { z } from 'zod';
import type { CreateShopDto as SharedCreateShopDto } from '@sales-planner/shared';
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
export type CreateShopDto = AssertCompatible<SharedCreateShopDto, z.infer<typeof CreateShopSchema>>;
export type UpdateShopDto = z.infer<typeof UpdateShopSchema>;
