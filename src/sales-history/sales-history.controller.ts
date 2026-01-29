import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  SalesHistoryService,
  CreateSalesHistoryDto,
  UpdateSalesHistoryDto,
  SalesHistory,
  isValidPeriod,
} from './sales-history.service.js';
import { AuthGuard, AuthenticatedRequest } from '../auth/index.js';

interface ImportSalesHistoryItem {
  sku_id: number;
  period: string; // "YYYY-MM"
  quantity: number;
  amount: string;
}

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

@Controller('sales-history')
@UseGuards(AuthGuard)
export class SalesHistoryController {
  constructor(private readonly salesHistoryService: SalesHistoryService) {}

  private getShopRoles(user: AuthenticatedRequest['user'], shopId: number): string[] {
    const shopRole = user.shopRoles.find((sr) => sr.shopId === shopId);
    return shopRole?.roles || [];
  }

  private getTenantRoles(user: AuthenticatedRequest['user'], tenantId: number): string[] {
    const tenantRole = user.tenantRoles.find((tr) => tr.tenantId === tenantId);
    return tenantRole?.roles || [];
  }

  private isTenantAdmin(user: AuthenticatedRequest['user'], tenantId: number): boolean {
    const tenantRoles = this.getTenantRoles(user, tenantId);
    return tenantRoles.includes('tenantAdmin');
  }

  private hasReadAccess(
    user: AuthenticatedRequest['user'],
    shopId: number,
    tenantId: number,
  ): boolean {
    if (this.isTenantAdmin(user, tenantId)) {
      return true;
    }
    const shopRoles = this.getShopRoles(user, shopId);
    return shopRoles.includes('viewer') || shopRoles.includes('editor');
  }

  private hasWriteAccess(
    user: AuthenticatedRequest['user'],
    shopId: number,
    tenantId: number,
  ): boolean {
    if (this.isTenantAdmin(user, tenantId)) {
      return true;
    }
    const shopRoles = this.getShopRoles(user, shopId);
    return shopRoles.includes('editor');
  }

  private validateReadAccess(
    user: AuthenticatedRequest['user'],
    shopId: number,
    tenantId: number,
  ): void {
    if (!user.tenantIds.includes(tenantId)) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }
    if (!this.hasReadAccess(user, shopId, tenantId)) {
      throw new ForbiddenException('Viewer or editor role required for this shop');
    }
  }

  private validateWriteAccess(
    user: AuthenticatedRequest['user'],
    shopId: number,
    tenantId: number,
  ): void {
    if (!user.tenantIds.includes(tenantId)) {
      throw new ForbiddenException('Access to this tenant is not allowed');
    }
    if (!this.hasWriteAccess(user, shopId, tenantId)) {
      throw new ForbiddenException('Editor role required for this shop');
    }
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Query('period_from') periodFrom?: string,
    @Query('period_to') periodTo?: string,
  ): Promise<SalesHistory[]> {
    this.validateReadAccess(req.user, shopId, tenantId);

    if (periodFrom && !isValidPeriod(periodFrom)) {
      throw new BadRequestException('period_from must be in YYYY-MM format');
    }
    if (periodTo && !isValidPeriod(periodTo)) {
      throw new BadRequestException('period_to must be in YYYY-MM format');
    }

    return this.salesHistoryService.findByShopAndPeriod(shopId, periodFrom, periodTo);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SalesHistory> {
    this.validateReadAccess(req.user, shopId, tenantId);

    const record = await this.salesHistoryService.findById(id);
    if (!record) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (record.shop_id !== shopId || record.tenant_id !== tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    return record;
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() dto: Omit<CreateSalesHistoryDto, 'shop_id' | 'tenant_id'>,
  ): Promise<SalesHistory> {
    this.validateWriteAccess(req.user, shopId, tenantId);

    if (!isValidPeriod(dto.period)) {
      throw new BadRequestException('period must be in YYYY-MM format with valid month (01-12)');
    }

    return this.salesHistoryService.create({
      ...dto,
      shop_id: shopId,
      tenant_id: tenantId,
    });
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesHistoryDto,
  ): Promise<SalesHistory> {
    this.validateWriteAccess(req.user, shopId, tenantId);

    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== shopId || existing.tenant_id !== tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    const updated = await this.salesHistoryService.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }
    return updated;
  }

  @Delete(':id')
  async delete(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    this.validateWriteAccess(req.user, shopId, tenantId);

    const existing = await this.salesHistoryService.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales history record with id ${id} not found`);
    }

    if (existing.shop_id !== shopId || existing.tenant_id !== tenantId) {
      throw new NotFoundException(
        `Sales history record with id ${id} not found in this shop/tenant`,
      );
    }

    await this.salesHistoryService.delete(id);
  }

  @Post('import')
  async importJson(
    @Req() req: AuthenticatedRequest,
    @Query('shop_id', ParseIntPipe) shopId: number,
    @Query('tenant_id', ParseIntPipe) tenantId: number,
    @Body() items: ImportSalesHistoryItem[],
  ): Promise<ImportResult> {
    this.validateWriteAccess(req.user, shopId, tenantId);

    if (!Array.isArray(items)) {
      throw new BadRequestException('Body must be an array of sales history items');
    }

    return this.salesHistoryService.bulkUpsert(items, shopId, tenantId);
  }
}
