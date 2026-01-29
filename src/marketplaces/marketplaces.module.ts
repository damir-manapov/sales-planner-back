import { Module } from '@nestjs/common';
import { MarketplacesController } from './marketplaces.controller.js';
import { MarketplacesService } from './marketplaces.service.js';

@Module({
  controllers: [MarketplacesController],
  providers: [MarketplacesService],
  exports: [MarketplacesService],
})
export class MarketplacesModule {}
