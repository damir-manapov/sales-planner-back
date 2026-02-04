import { z } from 'zod';
import type { CreateApiKeyDto as SharedCreateApiKeyDto } from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { id, name } = zodSchemas;

// Zod schemas
export const CreateApiKeySchema = z.object({
  user_id: id(),
  key: name().optional(), // key uses same constraints as name (1-255)
  name: name().optional(),
  expires_at: z.string().datetime().optional(),
});

export const UpdateApiKeySchema = z.object({
  name: name().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateApiKeyDto = AssertCompatible<SharedCreateApiKeyDto, z.infer<typeof CreateApiKeySchema>>;
export type UpdateApiKeyDto = z.infer<typeof UpdateApiKeySchema>;
