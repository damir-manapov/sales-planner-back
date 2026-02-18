export interface SeasonalCoefficient {
  id: number;
  tenantId: number;
  shopId: number;
  groupId: number;
  month: number; // 1-12
  coefficient: number;
  createdAt: Date;
  updatedAt: Date;
}
