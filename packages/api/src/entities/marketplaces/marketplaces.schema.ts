import type {
  CreateMarketplaceDto as SharedCreateMarketplaceDto,
  CreateMarketplaceRequest as SharedCreateMarketplaceRequest,
  ImportMarketplaceItem as SharedImportMarketplaceItem,
  UpdateMarketplaceDto as SharedUpdateMarketplaceDto,
  UpdateMarketplaceRequest as SharedUpdateMarketplaceRequest,
} from '@sales-planner/shared';
import { z } from 'zod';
import { AssertCompatible, zodSchemas } from '../../common/schema.utils.js';

const { shortId, title } = zodSchemas;

// Zod schemas
// Note: shop_id and tenant_id are injected from ShopContext, not from request body
export const CreateMarketplaceSchema = z.object({
  code: shortId(),
  title: title(),
});

export const UpdateMarketplaceSchema = z.object({
  title: title().optional(),
  // Note: shop_id and tenant_id are intentionally not updatable
});

export const ImportMarketplaceItemSchema = z.object({
  code: shortId(),
  title: title(),
});

// TypeScript types
export type CreateMarketplaceRequest = AssertCompatible<
  SharedCreateMarketplaceRequest,
  z.infer<typeof CreateMarketplaceSchema>
>;
export type CreateMarketplaceDto = AssertCompatible<
  SharedCreateMarketplaceDto,
  Omit<SharedCreateMarketplaceDto, never>
>;
export type UpdateMarketplaceDto = AssertCompatible<
  SharedUpdateMarketplaceDto,
  z.infer<typeof UpdateMarketplaceSchema>
>;
export type UpdateMarketplaceRequest = AssertCompatible<
  SharedUpdateMarketplaceRequest,
  z.infer<typeof UpdateMarketplaceSchema>
>;

// ImportMarketplaceItem uses AssertCompatible to ensure compatibility with shared type
export type ImportMarketplaceItem = AssertCompatible<
  SharedImportMarketplaceItem,
  z.infer<typeof ImportMarketplaceItemSchema>
>;
