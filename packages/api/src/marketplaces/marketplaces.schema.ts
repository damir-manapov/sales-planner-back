import { z } from 'zod';
import type { CreateMarketplaceDto as SharedCreateMarketplaceDto } from '@sales-planner/shared';

// Type compatibility helper - fails at compile time if types don't match
type AssertCompatible<T, U extends T> = U;

// Zod schemas
export const CreateMarketplaceSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
});

export const UpdateMarketplaceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateMarketplaceDto = AssertCompatible<SharedCreateMarketplaceDto, z.infer<typeof CreateMarketplaceSchema>>;
export type UpdateMarketplaceDto = z.infer<typeof UpdateMarketplaceSchema>;
