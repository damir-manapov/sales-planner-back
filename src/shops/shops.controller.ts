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
  UseGuards,
  Req,
} from '@nestjs/common';
import { ShopsService, CreateShopDto, Shop } from './shops.service.js';
import { AuthGuard, AuthenticatedRequest, validateWriteAccess } from '../auth/index.js';

@Controller('shops')
@UseGuards(AuthGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId?: string): Promise<Shop[]> {
    if (tenantId) {
      return this.shopsService.findByTenantId(Number(tenantId));
    }
    return this.shopsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Shop> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }
    return shop;
  }

  @Post()
  async create(@Body() dto: CreateShopDto): Promise<Shop> {
    return this.shopsService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateShopDto>,
  ): Promise<Shop> {
    const shop = await this.shopsService.update(id, dto);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }
    return shop;
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.shopsService.delete(id);
  }

  @Delete(':id/data')
  async deleteData(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ skusDeleted: number; salesHistoryDeleted: number }> {
    const shop = await this.shopsService.findById(id);
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }

    // Validate user has write access to this shop
    validateWriteAccess(req.user, id, shop.tenant_id);

    return this.shopsService.deleteData(id);
  }
}
