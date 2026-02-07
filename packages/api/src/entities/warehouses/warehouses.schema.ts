import type {
  CreateWarehouseDto as SharedCreateWarehouseDto,
  CreateWarehouseRequest as SharedCreateWarehouseRequest,
  ImportWarehouseItem as SharedImportWarehouseItem,
  UpdateWarehouseDto as SharedUpdateWarehouseDto,
  UpdateWarehouseRequest as SharedUpdateWarehouseRequest,
} from '@sales-planner/shared';
import type { z } from 'zod';
import {
  AssertCompatible,
  CodedTitledCreateSchema,
  CodedTitledImportSchema,
  CodedTitledUpdateSchema,
} from '../../common/index.js';

// Zod schemas - reuse common coded entity schemas
export const CreateWarehouseSchema = CodedTitledCreateSchema;
export const UpdateWarehouseSchema = CodedTitledUpdateSchema;
export const ImportWarehouseItemSchema = CodedTitledImportSchema;

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
