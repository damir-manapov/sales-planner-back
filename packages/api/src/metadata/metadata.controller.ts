import { Controller, Get } from '@nestjs/common';
import { ENTITIES_METADATA } from '@sales-planner/shared';

@Controller('metadata')
export class MetadataController {
  @Get('entities')
  getEntitiesMetadata() {
    return ENTITIES_METADATA;
  }
}
