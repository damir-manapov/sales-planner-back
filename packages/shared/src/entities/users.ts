export interface User {
  id: number;
  email: string;
  name: string;
  defaultShopId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
