export interface ApiKey {
  id: number;
  userId: number;
  key: string;
  name: string | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
