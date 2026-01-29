import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys/api-keys.service.js';
import { UserRolesService } from '../user-roles/user-roles.service.js';
import { TenantsService } from '../tenants/tenants.service.js';

export interface TenantRole {
  tenantId: number;
  roles: string[];
}

export interface ShopRole {
  shopId: number;
  roles: string[];
}

export interface AuthenticatedUser {
  id: number;
  tenantIds: number[];
  ownedTenantIds: number[];
  tenantRoles: TenantRole[];
  shopRoles: ShopRole[];
  isSystemAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly userRolesService: UserRolesService,
    private readonly tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validApiKey = await this.apiKeysService.findValidByKey(apiKey);
    if (!validApiKey) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    const userRolesWithNames = await this.userRolesService.findByUserIdWithRoleNames(
      validApiKey.user_id,
    );

    // Check if user is systemAdmin (no tenant_id and no shop_id means global role)
    const isSystemAdmin = userRolesWithNames.some(
      (ur) => ur.tenant_id === null && ur.shop_id === null && ur.role_name === 'systemAdmin',
    );

    // Get tenant IDs from user roles (tenant-level roles have tenant_id but no shop_id)
    const tenantIds = [
      ...new Set(
        userRolesWithNames
          .filter((ur) => ur.tenant_id !== null)
          .map((ur) => ur.tenant_id as number),
      ),
    ];

    // Build tenantRoles: group tenant-level roles by tenant (roles with tenant_id but no shop_id)
    const tenantRolesMap = new Map<number, string[]>();
    for (const ur of userRolesWithNames) {
      if (ur.tenant_id !== null && ur.shop_id === null) {
        const roles = tenantRolesMap.get(ur.tenant_id) || [];
        roles.push(ur.role_name);
        tenantRolesMap.set(ur.tenant_id, roles);
      }
    }
    const tenantRoles: TenantRole[] = Array.from(tenantRolesMap.entries()).map(
      ([tenantId, roles]) => ({
        tenantId,
        roles,
      }),
    );

    // Build shopRoles: group shop-level roles by shop (roles with shop_id)
    const shopRolesMap = new Map<number, string[]>();
    for (const ur of userRolesWithNames) {
      if (ur.shop_id !== null) {
        const roles = shopRolesMap.get(ur.shop_id) || [];
        roles.push(ur.role_name);
        shopRolesMap.set(ur.shop_id, roles);
      }
    }
    const shopRoles: ShopRole[] = Array.from(shopRolesMap.entries()).map(([shopId, roles]) => ({
      shopId,
      roles,
    }));

    // Get tenant IDs where user is the owner (derived tenantOwner role)
    const ownedTenants = await this.tenantsService.findByOwnerId(validApiKey.user_id);
    const ownedTenantIds = ownedTenants.map((t) => t.id);

    // Include owned tenants in tenantIds for access check
    const allTenantIds = [...new Set([...tenantIds, ...ownedTenantIds])];

    request.user = {
      id: validApiKey.user_id,
      tenantIds: allTenantIds,
      ownedTenantIds,
      tenantRoles,
      shopRoles,
      isSystemAdmin,
    };

    return true;
  }

  private extractApiKey(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return (request.headers['x-api-key'] as string | undefined) ?? null;
  }
}
