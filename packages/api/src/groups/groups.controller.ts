import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthenticatedRequest, AuthGuard } from '../auth/auth.guard.js';
import {
  RequireReadAccess,
  RequireWriteAccess,
  ShopContext,
  type ShopContext as ShopContextType,
} from '../auth/decorators.js';
import {
  type ExpressResponse,
  type ImportResult,
  parseAndValidateImport,
  parseCsvImport,
  sendCsvExport,
  sendJsonExport,
  ZodValidationPipe,
} from '../common/index.js';
import {
  type CreateGroupRequest,
  CreateGroupSchema,
  type ImportGroupItem,
  ImportGroupItemSchema,
  type UpdateGroupRequest,
  UpdateGroupSchema,
} from './groups.schema.js';
import { type Group, GroupsService } from './groups.service.js';

@Controller('groups')
@UseGuards(AuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @RequireReadAccess()
  async findAll(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
  ): Promise<Group[]> {
    return this.groupsService.findByShopId(ctx.shopId);
  }

  @Get('code/:code')
  @RequireReadAccess()
  async findByCode(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('code') code: string,
  ): Promise<Group> {
    const group = await this.groupsService.findByCodeAndShop(code, ctx.shopId);
    if (!group || group.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Group with code ${code} not found`);
    }

    return group;
  }

  @Get('export/json')
  @RequireReadAccess()
  async exportJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.groupsService.exportForShop(ctx.shopId);
    sendJsonExport(res, items, 'groups.json');
  }

  @Get('export/csv')
  @RequireReadAccess()
  async exportCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Res() res: ExpressResponse,
  ): Promise<void> {
    const items = await this.groupsService.exportForShop(ctx.shopId);
    sendCsvExport(res, items, 'groups.csv', ['code', 'title']);
  }

  @Get(':id')
  @RequireReadAccess()
  async findById(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Group> {
    const brand = await this.groupsService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Group with id ${id} not found in this shop/tenant`);
    }

    return brand;
  }

  @Post()
  @RequireWriteAccess()
  async create(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body(new ZodValidationPipe(CreateGroupSchema)) body: CreateGroupRequest,
  ): Promise<Group> {
    return this.groupsService.create({
      ...body,
      shop_id: ctx.shopId,
      tenant_id: ctx.tenantId,
    });
  }

  @Put(':id')
  @RequireWriteAccess()
  async update(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateGroupSchema)) body: UpdateGroupRequest,
  ): Promise<Group> {
    // Check brand exists and belongs to the user's shop/tenant
    const brand = await this.groupsService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Group with id ${id} not found in this shop/tenant`);
    }

    const updated = await this.groupsService.update(id, body);
    if (!updated) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    return updated;
  }

  @Delete(':id')
  @RequireWriteAccess()
  async delete(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    // Check brand exists and belongs to the user's shop/tenant
    const brand = await this.groupsService.findById(id);
    if (!brand) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    if (brand.shop_id !== ctx.shopId || brand.tenant_id !== ctx.tenantId) {
      throw new NotFoundException(`Group with id ${id} not found in this shop/tenant`);
    }

    await this.groupsService.delete(id);
    return { message: 'Group deleted successfully' };
  }

  @Post('import/json')
  @RequireWriteAccess()
  async importJson(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @Body() items?: ImportGroupItem[],
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const validatedData = parseAndValidateImport(file, items, ImportGroupItemSchema);
    return this.groupsService.bulkUpsert(validatedData, ctx.shopId, ctx.tenantId);
  }

  @Post('import/csv')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @RequireWriteAccess()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() _req: AuthenticatedRequest,
    @ShopContext() ctx: ShopContextType,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportResult> {
    const records = parseCsvImport<{ code: string; title: string }>(file, undefined, [
      'code',
      'title',
    ]);
    const items: ImportGroupItem[] = records.map((record) => ({
      code: record.code,
      title: record.title,
    }));
    return this.groupsService.bulkUpsert(items, ctx.shopId, ctx.tenantId);
  }
}
