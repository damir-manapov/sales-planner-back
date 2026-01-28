import { Module } from '@nestjs/common';
import { UserShopsController } from './user-shops.controller.js';
import { UserShopsService } from './user-shops.service.js';

@Module({
  controllers: [UserShopsController],
  providers: [UserShopsService],
  exports: [UserShopsService],
})
export class UserShopsModule {}
