import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { TenantsService, CreateTenantDto, Tenant } from './tenants.service.js';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Tenant> {
    const tenant = await this.tenantsService.findById(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  @Post()
  async create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantsService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateTenantDto>,
  ): Promise<Tenant> {
    const tenant = await this.tenantsService.update(id, dto);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.tenantsService.delete(id);
  }
}
