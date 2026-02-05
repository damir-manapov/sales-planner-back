export interface Tenant {
  id: number;
  title: string;
  owner_id: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}
