import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public, CurrentUser, AuthUser } from './auth/index.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
