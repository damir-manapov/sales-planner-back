import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller.js';

@Module({
  controllers: [MetadataController],
})
export class MetadataModule {}
