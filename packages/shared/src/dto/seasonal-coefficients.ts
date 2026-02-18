// Seasonal coefficients
export interface CreateSeasonalCoefficientRequest {
  groupId: number;
  month: number; // 1-12
  coefficient: number;
}

export interface CreateSeasonalCoefficientDto {
  tenantId: number;
  shopId: number;
  groupId: number;
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
