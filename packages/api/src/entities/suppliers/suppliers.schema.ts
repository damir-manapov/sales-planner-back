import type {
  CreateSupplierDto as SharedCreateSupplierDto,
  CreateSupplierRequest as SharedCreateSupplierRequest,
  UpdateSupplierDto as SharedUpdateSupplierDto,
  UpdateSupplierRequest as SharedUpdateSupplierRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/index.js';

const { code, title } = zodSchemas;

// Zod schemas
export const CreateSupplierSchema = z.object({
  code: code(),
  title: title(),
});

export const UpdateSupplierSchema = z.object({
  code: code().optional(),
  title: title().optional(),
});

export const ImportSupplierItemSchema = z.object({
  code: code(),
  title: title(),
});

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
export type ImportSupplierItem = z.infer<typeof ImportSupplierItemSchema>;
