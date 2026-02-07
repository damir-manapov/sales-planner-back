import type {
  CreateBrandDto as SharedCreateBrandDto,
  CreateBrandRequest as SharedCreateBrandRequest,
  ImportBrandItem as SharedImportBrandItem,
  UpdateBrandDto as SharedUpdateBrandDto,
  UpdateBrandRequest as SharedUpdateBrandRequest,
} from '@sales-planner/shared';
import type { z } from 'zod';
import {
  AssertCompatible,
  CodedTitledCreateSchema,
  CodedTitledImportSchema,
  CodedTitledUpdateSchema,
} from '../../common/index.js';

// Zod schemas - reuse common coded entity schemas
export const CreateBrandSchema = CodedTitledCreateSchema;
export const UpdateBrandSchema = CodedTitledUpdateSchema;
export const ImportBrandItemSchema = CodedTitledImportSchema;

// TypeScript types
export type CreateBrandRequest = AssertCompatible<
  SharedCreateBrandRequest,
  z.infer<typeof CreateBrandSchema>
>;
export type CreateBrandDto = AssertCompatible<
  SharedCreateBrandDto,
  Omit<SharedCreateBrandDto, never>
>;
export type UpdateBrandDto = AssertCompatible<
  SharedUpdateBrandDto,
  z.infer<typeof UpdateBrandSchema>
>;
export type UpdateBrandRequest = AssertCompatible<
  SharedUpdateBrandRequest,
  z.infer<typeof UpdateBrandSchema>
>;
export type ImportBrandItem = AssertCompatible<
  SharedImportBrandItem,
  z.infer<typeof ImportBrandItemSchema>
>;
