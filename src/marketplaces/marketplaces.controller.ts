import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  MarketplacesService,
  CreateMarketplaceDto,
  UpdateMarketplaceDto,
  Marketplace,
} from './marketplaces.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';

@Controller('marketplaces')
@UseGuards(AuthGuard, SystemAdminGuard)
export class MarketplacesController {
  constructor(private readonly marketplacesService: MarketplacesService) {}

  @Get()
  async findAll(): Promise<Marketplace[]> {
    return this.marketplacesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.findById(id);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }
    return marketplace;
  }

  @Post()
  async create(@Body() dto: CreateMarketplaceDto): Promise<Marketplace> {
    return this.marketplacesService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMarketplaceDto): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.update(id, dto);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }
    return marketplace;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.marketplacesService.delete(id);
  }
}
