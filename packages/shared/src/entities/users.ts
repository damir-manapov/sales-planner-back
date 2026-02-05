export interface User {
  id: number;
  email: string;
  name: string;
  default_shop_id: number | null;
  created_at: Date;
  updated_at: Date;
}
