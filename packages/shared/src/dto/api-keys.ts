export interface CreateApiKeyDto {
  user_id: number;
  name?: string;
  expires_at?: string;
}
export type CreateApiKeyRequest = CreateApiKeyDto;

export interface UpdateApiKeyDto {
  name?: string | null;
  expires_at?: string | null;
}
export type UpdateApiKeyRequest = UpdateApiKeyDto;
