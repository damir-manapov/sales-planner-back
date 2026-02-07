import type {
  CreateGroupDto as SharedCreateGroupDto,
  CreateGroupRequest as SharedCreateGroupRequest,
  ImportGroupItem as SharedImportGroupItem,
  UpdateGroupDto as SharedUpdateGroupDto,
  UpdateGroupRequest as SharedUpdateGroupRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/index.js';

const { code, title } = zodSchemas;

// Zod schemas
export const CreateGroupSchema = z.object({
  code: code(),
  title: title(),
});

export const UpdateGroupSchema = z.object({
  code: code().optional(),
  title: title().optional(),
});

export const ImportGroupItemSchema = z.object({
  code: code(),
  title: title(),
});

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
