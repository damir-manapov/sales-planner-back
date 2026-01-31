import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; version: string } {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    return { status: 'ok', version: packageJson.version };
  }

  @Get('version')
  getVersion(): { version: string } {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    return { version: packageJson.version };
  }
}
