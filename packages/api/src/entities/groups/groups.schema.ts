import type {
  CreateGroupDto as SharedCreateGroupDto,
  CreateGroupRequest as SharedCreateGroupRequest,
  ImportGroupItem as SharedImportGroupItem,
  UpdateGroupDto as SharedUpdateGroupDto,
  UpdateGroupRequest as SharedUpdateGroupRequest,
} from '@sales-planner/shared';
import type { z } from 'zod';
import {
  AssertCompatible,
  CodedTitledCreateSchema,
  CodedTitledImportSchema,
  CodedTitledUpdateSchema,
} from '../../common/index.js';

// Zod schemas - reuse common coded entity schemas
export const CreateGroupSchema = CodedTitledCreateSchema;
export const UpdateGroupSchema = CodedTitledUpdateSchema;
export const ImportGroupItemSchema = CodedTitledImportSchema;

// TypeScript types
export type CreateGroupRequest = AssertCompatible<
  SharedCreateGroupRequest,
  z.infer<typeof CreateGroupSchema>
>;
export type CreateGroupDto = AssertCompatible<
  SharedCreateGroupDto,
  Omit<SharedCreateGroupDto, never>
>;
export type UpdateGroupDto = AssertCompatible<
  SharedUpdateGroupDto,
  z.infer<typeof UpdateGroupSchema>
>;
export type UpdateGroupRequest = AssertCompatible<
  SharedUpdateGroupRequest,
  z.infer<typeof UpdateGroupSchema>
>;
export type ImportGroupItem = AssertCompatible<
  SharedImportGroupItem,
  z.infer<typeof ImportGroupItemSchema>
>;
