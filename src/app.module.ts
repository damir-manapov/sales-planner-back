import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/index.js';
import { UsersModule } from './users/index.js';
import { TenantsModule } from './tenants/index.js';
import { ShopsModule } from './shops/index.js';
import { UserShopsModule } from './user-shops/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    UsersModule,
    TenantsModule,
    ShopsModule,
    UserShopsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
