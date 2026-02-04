import { z } from 'zod';
import type { CreateApiKeyDto as SharedCreateApiKeyDto } from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateApiKeySchema = z.object({
  user_id: z.number().int().positive(),
  key: z.string().min(1).max(255).optional(),
  name: z.string().min(1).max(255).optional(),
  expires_at: z.string().datetime().optional(),
});

export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(255).nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateApiKeyDto = AssertCompatible<SharedCreateApiKeyDto, z.infer<typeof CreateApiKeySchema>>;
export type UpdateApiKeyDto = z.infer<typeof UpdateApiKeySchema>;
