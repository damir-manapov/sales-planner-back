import type {
  CreateSupplierDto as SharedCreateSupplierDto,
  CreateSupplierRequest as SharedCreateSupplierRequest,
  ImportSupplierItem as SharedImportSupplierItem,
  UpdateSupplierDto as SharedUpdateSupplierDto,
  UpdateSupplierRequest as SharedUpdateSupplierRequest,
} from '@sales-planner/shared';
import type { z } from 'zod';
import {
  AssertCompatible,
  CodedTitledCreateSchema,
  CodedTitledImportSchema,
  CodedTitledUpdateSchema,
} from '../../common/index.js';

// Zod schemas - reuse common coded entity schemas
export const CreateSupplierSchema = CodedTitledCreateSchema;
export const UpdateSupplierSchema = CodedTitledUpdateSchema;
export const ImportSupplierItemSchema = CodedTitledImportSchema;

// TypeScript types
export type CreateSupplierRequest = AssertCompatible<
  SharedCreateSupplierRequest,
  z.infer<typeof CreateSupplierSchema>
>;
export type CreateSupplierDto = AssertCompatible<
  SharedCreateSupplierDto,
  Omit<SharedCreateSupplierDto, never>
>;
export type UpdateSupplierDto = AssertCompatible<
  SharedUpdateSupplierDto,
  z.infer<typeof UpdateSupplierSchema>
>;
export type UpdateSupplierRequest = AssertCompatible<
  SharedUpdateSupplierRequest,
  z.infer<typeof UpdateSupplierSchema>
>;
export type ImportSupplierItem = AssertCompatible<
  SharedImportSupplierItem,
  z.infer<typeof ImportSupplierItemSchema>
>;
