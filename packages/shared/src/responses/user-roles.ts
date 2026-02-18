/**
 * Response type for user-roles API endpoints
 * Note: This is different from UserRole in users.ts which is used for /me endpoint
 */
export interface UserRoleResponse {
  id: number;
  userId: number;
  roleId: number;
  tenantId: number | null;
  shopId: number | null;
}
