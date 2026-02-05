export interface ApiKey {
  id: number;
  user_id: number;
  key: string;
  name: string | null;
  expires_at: Date | null;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
