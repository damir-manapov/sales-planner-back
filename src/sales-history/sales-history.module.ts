import { Module } from '@nestjs/common';
import { SalesHistoryController } from './sales-history.controller.js';
import { SalesHistoryExamplesController } from './sales-history-examples.controller.js';
import { SalesHistoryService } from './sales-history.service.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { UserRolesModule } from '../user-roles/user-roles.module.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Module({
  imports: [ApiKeysModule, UserRolesModule],
  controllers: [SalesHistoryExamplesController, SalesHistoryController],
  providers: [SalesHistoryService, AuthGuard],
  exports: [SalesHistoryService],
})
export class SalesHistoryModule {}
