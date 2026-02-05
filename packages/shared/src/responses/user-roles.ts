/**
 * Response type for user-roles API endpoints
 * Note: This is different from UserRole in users.ts which is used for /me endpoint
 */
export interface UserRoleResponse {
  id: number;
  user_id: number;
  role_id: number;
  tenant_id: number | null;
  shop_id: number | null;
}
