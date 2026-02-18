export interface Tenant {
  id: number;
  title: string;
  ownerId: number | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}
