import type { User } from '../entities/users';

export interface UserRole {
  id: number;
  roleName: string;
  tenantId: number | null;
  tenantTitle: string | null;
  shopId: number | null;
  shopTitle: string | null;
}

export interface ShopInfo {
  id: number;
  title: string;
}

export interface TenantInfo {
  id: number;
  title: string;
  isOwner: boolean;
  shops: ShopInfo[];
}

export interface UserWithRolesAndTenants extends User {
  roles: UserRole[];
  tenants: TenantInfo[];
}
