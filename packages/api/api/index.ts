import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module.js';

const server = express();
let isAppInitialized = false;

export default async function handler(req: express.Request, res: express.Response) {
  if (!isAppInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors();

    // Read version from package.json with fallback
    let version = '1.0.0';
    try {
      const packageJsonPath = join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
        version: string;
      };
      version = packageJson.version;
    } catch (error) {
      console.warn('Could not read package.json, using default version');
    }

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('Sales Planner API')
      .setDescription('NestJS API for sales planning and management')
      .setVersion(version)
      .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'apiKey')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        url: '/api-json',
      },
      customCss: '.swagger-ui .topbar { display: none }',
      customfavIcon: 'https://nestjs.com/favicon.ico',
      customSiteTitle: 'Sales Planner API',
      customCssUrl: ['https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css'],
      customJs: [
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
      ],
    });

    await app.init();
    isAppInitialized = true;
  }
  server(req, res);
}
