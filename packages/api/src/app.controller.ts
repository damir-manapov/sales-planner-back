import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

// Version is injected at build time by esbuild
declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; version: string } {
    return { status: 'ok', version: APP_VERSION };
  }

  @Get('version')
  getVersion(): { version: string } {
    return { version: APP_VERSION };
  }
}
