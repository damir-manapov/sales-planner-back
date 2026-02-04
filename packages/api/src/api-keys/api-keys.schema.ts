import { z } from 'zod';
import type {
  CreateApiKeyRequest as SharedCreateApiKeyRequest,
  CreateApiKeyDto as SharedCreateApiKeyDto,
  UpdateApiKeyRequest as SharedUpdateApiKeyRequest,
  UpdateApiKeyDto as SharedUpdateApiKeyDto,
} from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { id, name } = zodSchemas;

// Zod schemas
export const CreateApiKeySchema = z.object({
  user_id: id(),
  name: name().optional(),
  expires_at: z.string().datetime().optional(),
});

export const UpdateApiKeySchema = z.object({
  name: name().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateApiKeyRequest = AssertCompatible<
  SharedCreateApiKeyRequest,
  z.infer<typeof CreateApiKeySchema>
>;
export type CreateApiKeyDto = AssertCompatible<
  SharedCreateApiKeyDto,
  z.infer<typeof CreateApiKeySchema>
>;
export type UpdateApiKeyDto = AssertCompatible<
  SharedUpdateApiKeyDto,
  z.infer<typeof UpdateApiKeySchema>
>;
export type UpdateApiKeyRequest = AssertCompatible<
  SharedUpdateApiKeyRequest,
  z.infer<typeof UpdateApiKeySchema>
>;
