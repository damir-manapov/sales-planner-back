import type {
  CreateCategoryDto as SharedCreateCategoryDto,
  CreateCategoryRequest as SharedCreateCategoryRequest,
  ImportCategoryItem as SharedImportCategoryItem,
  UpdateCategoryDto as SharedUpdateCategoryDto,
  UpdateCategoryRequest as SharedUpdateCategoryRequest,
} from '@sales-planner/shared';
import type { z } from 'zod';
import {
  AssertCompatible,
  CodedTitledCreateSchema,
  CodedTitledImportSchema,
  CodedTitledUpdateSchema,
} from '../../common/index.js';

// Zod schemas - reuse common coded entity schemas
export const CreateCategorySchema = CodedTitledCreateSchema;
export const UpdateCategorySchema = CodedTitledUpdateSchema;
export const ImportCategoryItemSchema = CodedTitledImportSchema;

// TypeScript types
export type CreateCategoryRequest = AssertCompatible<
  SharedCreateCategoryRequest,
  z.infer<typeof CreateCategorySchema>
>;
export type CreateCategoryDto = AssertCompatible<
  SharedCreateCategoryDto,
  Omit<SharedCreateCategoryDto, never>
>;
export type UpdateCategoryDto = AssertCompatible<
  SharedUpdateCategoryDto,
  z.infer<typeof UpdateCategorySchema>
>;
export type UpdateCategoryRequest = AssertCompatible<
  SharedUpdateCategoryRequest,
  z.infer<typeof UpdateCategorySchema>
>;
export type ImportCategoryItem = AssertCompatible<
  SharedImportCategoryItem,
  z.infer<typeof ImportCategoryItemSchema>
>;
