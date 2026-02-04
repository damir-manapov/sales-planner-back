import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { SystemAdminGuard } from '../auth/system-admin.guard.js';
import {
  CreateMarketplaceDto,
  Marketplace,
  MarketplacesService,
  UpdateMarketplaceDto,
} from './marketplaces.service.js';

@Controller('marketplaces')
@UseGuards(AuthGuard)
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
  @UseGuards(SystemAdminGuard)
  async create(@Body() dto: CreateMarketplaceDto): Promise<Marketplace> {
    return this.marketplacesService.create(dto);
  }

  @Put(':id')
  @UseGuards(SystemAdminGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateMarketplaceDto): Promise<Marketplace> {
    const marketplace = await this.marketplacesService.update(id, dto);
    if (!marketplace) {
      throw new NotFoundException(`Marketplace with id ${id} not found`);
    }
    return marketplace;
  }

  @Delete(':id')
  @UseGuards(SystemAdminGuard)
  async delete(@Param('id') id: string): Promise<void> {
    await this.marketplacesService.delete(id);
  }
}
