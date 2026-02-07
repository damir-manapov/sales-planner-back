import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequireWriteAccess } from '../auth/decorators.js';
import {
  ComputedEntitiesService,
  type RefreshAllResult,
  type RefreshResult,
} from './computed-entities.service.js';

@Controller('computed')
@UseGuards(AuthGuard)
export class ComputedEntitiesController {
  constructor(private readonly service: ComputedEntitiesService) {}

  /**
   * List all materialized views
   */
  @Get('views')
  @RequireWriteAccess()
  getViews(): { name: string; description: string }[] {
    return this.service.getViews();
  }

  /**
   * Refresh all materialized views in dependency order
   */
  @Post('refresh')
  @RequireWriteAccess()
  async refreshAll(): Promise<RefreshAllResult> {
    return this.service.refreshAll();
  }

  /**
   * Refresh a specific materialized view
   */
  @Post('refresh/:viewName')
  @RequireWriteAccess()
  async refreshView(@Param('viewName') viewName: string): Promise<RefreshResult> {
    return this.service.refreshView(viewName);
  }
}
