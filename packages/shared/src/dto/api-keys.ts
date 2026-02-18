export interface CreateApiKeyDto {
  userId: number;
  name?: string;
  expiresAt?: string;
}
export type CreateApiKeyRequest = CreateApiKeyDto;

export interface UpdateApiKeyDto {
  name?: string | null;
  expiresAt?: string | null;
}
export type UpdateApiKeyRequest = UpdateApiKeyDto;
