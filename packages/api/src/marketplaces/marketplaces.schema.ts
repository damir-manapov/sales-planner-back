import { z } from 'zod';
import type { CreateMarketplaceDto as SharedCreateMarketplaceDto } from '@sales-planner/shared';
import { AssertCompatible, zodSchemas } from '../common/schema.utils.js';

const { shortId, title } = zodSchemas;

// Zod schemas
export const CreateMarketplaceSchema = z.object({
  id: shortId(),
  title: title(),
});

export const UpdateMarketplaceSchema = z.object({
  title: title().optional(),
});

// Infer TypeScript types from schemas with compatibility checks
export type CreateMarketplaceDto = AssertCompatible<
  SharedCreateMarketplaceDto,
  z.infer<typeof CreateMarketplaceSchema>
>;
export type UpdateMarketplaceDto = z.infer<typeof UpdateMarketplaceSchema>;
