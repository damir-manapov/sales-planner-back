import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { UserRolesService, CreateUserRoleDto, UserRole } from './user-roles.service.js';

@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('roleId') roleId?: string,
  ): Promise<UserRole[]> {
    if (userId) {
      return this.userRolesService.findByUserId(Number(userId));
    }
    if (roleId) {
      return this.userRolesService.findByRoleId(Number(roleId));
    }
    return this.userRolesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<UserRole> {
    const userRole = await this.userRolesService.findById(id);
    if (!userRole) {
      throw new NotFoundException(`UserRole with id ${id} not found`);
    }
    return userRole;
  }

  @Post()
  async create(@Body() dto: CreateUserRoleDto): Promise<UserRole> {
    return this.userRolesService.create(dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userRolesService.delete(id);
  }
}
