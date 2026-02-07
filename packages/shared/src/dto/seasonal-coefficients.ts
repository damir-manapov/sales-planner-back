// Seasonal coefficients
export interface CreateSeasonalCoefficientRequest {
  group_id: number;
  month: number; // 1-12
  coefficient: number;
}

export interface CreateSeasonalCoefficientDto {
  tenant_id: number;
  shop_id: number;
  group_id: number;
  month: number;
  coefficient: number;
}

export interface UpdateSeasonalCoefficientDto {
  coefficient?: number;
}

export type UpdateSeasonalCoefficientRequest = UpdateSeasonalCoefficientDto;

export interface ImportSeasonalCoefficientItem {
  group: string; // group code
  month: number; // 1-12
  coefficient: number;
}
