import type {
  CreateStatusDto as SharedCreateStatusDto,
  CreateStatusRequest as SharedCreateStatusRequest,
  UpdateStatusDto as SharedUpdateStatusDto,
  UpdateStatusRequest as SharedUpdateStatusRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { code, title } = zodSchemas;

// Zod schemas
export const CreateStatusSchema = z.object({
  code: code(),
  title: title(),
});

export const UpdateStatusSchema = z.object({
  code: code().optional(),
  title: title().optional(),
});

export const ImportStatusItemSchema = z.object({
  code: code(),
  title: title(),
});

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
export type ImportStatusItem = z.infer<typeof ImportStatusItemSchema>;
