import type {
  CreateStatusDto as SharedCreateStatusDto,
  CreateStatusRequest as SharedCreateStatusRequest,
  ImportStatusItem as SharedImportStatusItem,
  UpdateStatusDto as SharedUpdateStatusDto,
  UpdateStatusRequest as SharedUpdateStatusRequest,
} from '@sales-planner/shared';
import type { z } from 'zod';
import {
  AssertCompatible,
  CodedTitledCreateSchema,
  CodedTitledImportSchema,
  CodedTitledUpdateSchema,
} from '../../common/index.js';

// Zod schemas - reuse common coded entity schemas
export const CreateStatusSchema = CodedTitledCreateSchema;
export const UpdateStatusSchema = CodedTitledUpdateSchema;
export const ImportStatusItemSchema = CodedTitledImportSchema;

// TypeScript types
export type CreateStatusRequest = AssertCompatible<
  SharedCreateStatusRequest,
  z.infer<typeof CreateStatusSchema>
>;
export type CreateStatusDto = AssertCompatible<
  SharedCreateStatusDto,
  Omit<SharedCreateStatusDto, never>
>;
export type UpdateStatusDto = AssertCompatible<
  SharedUpdateStatusDto,
  z.infer<typeof UpdateStatusSchema>
>;
export type UpdateStatusRequest = AssertCompatible<
  SharedUpdateStatusRequest,
  z.infer<typeof UpdateStatusSchema>
>;
export type ImportStatusItem = AssertCompatible<
  SharedImportStatusItem,
  z.infer<typeof ImportStatusItemSchema>
>;
