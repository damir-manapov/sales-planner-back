// Categories
export interface CreateCategoryRequest {
  code: string;
  title: string;
}

export interface CreateCategoryDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateCategoryDto {
  code?: string;
  title?: string;
}

export type UpdateCategoryRequest = UpdateCategoryDto;

export interface ImportCategoryItem {
  code: string;
  title: string;
}
