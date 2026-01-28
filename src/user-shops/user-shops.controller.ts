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
import { UserShopsService, CreateUserShopDto, UserShop } from './user-shops.service.js';

@Controller('user-shops')
export class UserShopsController {
  constructor(private readonly userShopsService: UserShopsService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('shopId') shopId?: string,
  ): Promise<UserShop[]> {
    if (userId) {
      return this.userShopsService.findByUserId(Number(userId));
    }
    if (shopId) {
      return this.userShopsService.findByShopId(Number(shopId));
    }
    return this.userShopsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<UserShop> {
    const userShop = await this.userShopsService.findById(id);
    if (!userShop) {
      throw new NotFoundException(`UserShop with id ${id} not found`);
    }
    return userShop;
  }

  @Post()
  async create(@Body() dto: CreateUserShopDto): Promise<UserShop> {
    return this.userShopsService.create(dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userShopsService.delete(id);
  }
}
