import type { User } from '../entities/users';

export interface UserRole {
  id: number;
  role_name: string;
  tenant_id: number | null;
  tenant_title: string | null;
  shop_id: number | null;
  shop_title: string | null;
}

export interface ShopInfo {
  id: number;
  title: string;
}

export interface TenantInfo {
  id: number;
  title: string;
  is_owner: boolean;
  shops: ShopInfo[];
}

export interface UserWithRolesAndTenants extends User {
  roles: UserRole[];
  tenants: TenantInfo[];
}
