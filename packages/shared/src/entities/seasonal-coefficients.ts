export interface SeasonalCoefficient {
  id: number;
  tenant_id: number;
  shop_id: number;
  group_id: number;
  month: number; // 1-12
  coefficient: number;
  created_at: Date;
  updated_at: Date;
}
