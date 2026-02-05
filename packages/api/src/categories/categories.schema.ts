import type {
  CreateCategoryDto as SharedCreateCategoryDto,
  CreateCategoryRequest as SharedCreateCategoryRequest,
  UpdateCategoryDto as SharedUpdateCategoryDto,
  UpdateCategoryRequest as SharedUpdateCategoryRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { code, title } = zodSchemas;

// Zod schemas
export const CreateCategorySchema = z.object({
  code: code(),
  title: title(),
});

export const UpdateCategorySchema = z.object({
  code: code().optional(),
  title: title().optional(),
});

export const ImportCategoryItemSchema = z.object({
  code: code(),
  title: title(),
});

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
export type ImportCategoryItem = z.infer<typeof ImportCategoryItemSchema>;
