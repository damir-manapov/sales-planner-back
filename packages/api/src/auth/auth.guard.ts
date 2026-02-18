import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../entities/api-keys/api-keys.service.js';
import { ROLE_NAMES } from '../common/constants.js';
import { TenantsService } from '../entities/tenants/tenants.service.js';
import { UserRolesService } from '../entities/user-roles/user-roles.service.js';
import { hasReadAccess, hasWriteAccess } from './access-control.js';
import { ACCESS_LEVEL_KEY, AccessLevel } from './decorators.js';

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

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly userRolesService: UserRolesService,
    private readonly tenantsService: TenantsService,
    private readonly reflector: Reflector,
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
      validApiKey.userId,
    );

    // Check if user is systemAdmin (no tenantId and no shopId means global role)
    const isSystemAdmin = userRolesWithNames.some(
      (ur) => ur.tenantId === null && ur.shopId === null && ur.roleName === ROLE_NAMES.SYSTEM_ADMIN,
    );

    // Get tenant IDs from user roles (tenant-level roles have tenant_id but no shop_id)
    const tenantIds = [
      ...new Set(
        userRolesWithNames.filter((ur) => ur.tenantId !== null).map((ur) => ur.tenantId as number),
      ),
    ];

    // Build tenantRoles: group tenant-level roles by tenant (roles with tenant_id but no shop_id)
    const tenantRolesMap = new Map<number, string[]>();
    for (const ur of userRolesWithNames) {
      if (ur.tenantId !== null && ur.shopId === null) {
        const roles = tenantRolesMap.get(ur.tenantId) || [];
        roles.push(ur.roleName);
        tenantRolesMap.set(ur.tenantId, roles);
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
      if (ur.shopId !== null) {
        const roles = shopRolesMap.get(ur.shopId) || [];
        roles.push(ur.roleName);
        shopRolesMap.set(ur.shopId, roles);
      }
    }
    const shopRoles: ShopRole[] = Array.from(shopRolesMap.entries()).map(([shopId, roles]) => ({
      shopId,
      roles,
    }));

    // Get tenant IDs where user is the owner (derived tenantOwner role)
    const ownedTenants = await this.tenantsService.findByOwnerId(validApiKey.userId);
    const ownedTenantIds = ownedTenants.map((t) => t.id);

    // Include owned tenants in tenantIds for access check
    const allTenantIds = [...new Set([...tenantIds, ...ownedTenantIds])];

    request.user = {
      id: validApiKey.userId,
      tenantIds: allTenantIds,
      ownedTenantIds,
      tenantRoles,
      shopRoles,
      isSystemAdmin,
    };

    // Check access level if metadata is set
    const accessLevel = this.reflector.get<AccessLevel>(ACCESS_LEVEL_KEY, context.getHandler());
    if (accessLevel && accessLevel !== AccessLevel.NONE) {
      const query = request.query as Record<string, string | undefined>;
      const shopId = Number.parseInt(query.shopId ?? '', 10);
      const tenantId = Number.parseInt(query.tenantId ?? '', 10);

      if (Number.isNaN(shopId) || Number.isNaN(tenantId)) {
        throw new BadRequestException('shopId and tenantId are required');
      }

      if (!request.user.tenantIds.includes(tenantId)) {
        throw new ForbiddenException('Access to this tenant is not allowed');
      }

      if (accessLevel === AccessLevel.READ && !hasReadAccess(request.user, shopId, tenantId)) {
        throw new ForbiddenException('Viewer or editor role required for this shop');
      }

      if (accessLevel === AccessLevel.WRITE && !hasWriteAccess(request.user, shopId, tenantId)) {
        throw new ForbiddenException('Editor role required for this shop');
      }
    }

    return true;
  }

  private extractApiKey(request: AuthenticatedRequest): string | null {
    const authHeader = request.headers.authorization as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return (request.headers['x-api-key'] as string | undefined) ?? null;
  }
}
