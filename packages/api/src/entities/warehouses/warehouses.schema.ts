import type {
  CreateWarehouseDto as SharedCreateWarehouseDto,
  CreateWarehouseRequest as SharedCreateWarehouseRequest,
  ImportWarehouseItem as SharedImportWarehouseItem,
  UpdateWarehouseDto as SharedUpdateWarehouseDto,
  UpdateWarehouseRequest as SharedUpdateWarehouseRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/index.js';

const { code, title } = zodSchemas;

// Zod schemas
export const CreateWarehouseSchema = z.object({
  code: code(),
  title: title(),
});

export const UpdateWarehouseSchema = z.object({
  code: code().optional(),
  title: title().optional(),
});

export const ImportWarehouseItemSchema = z.object({
  code: code(),
  title: title(),
});

// TypeScript types
export type CreateWarehouseRequest = AssertCompatible<
  SharedCreateWarehouseRequest,
  z.infer<typeof CreateWarehouseSchema>
>;
export type CreateWarehouseDto = AssertCompatible<
  SharedCreateWarehouseDto,
  Omit<SharedCreateWarehouseDto, never>
>;
export type UpdateWarehouseDto = AssertCompatible<
  SharedUpdateWarehouseDto,
  z.infer<typeof UpdateWarehouseSchema>
>;
export type UpdateWarehouseRequest = AssertCompatible<
  SharedUpdateWarehouseRequest,
  z.infer<typeof UpdateWarehouseSchema>
>;
export type ImportWarehouseItem = AssertCompatible<
  SharedImportWarehouseItem,
  z.infer<typeof ImportWarehouseItemSchema>
>;
