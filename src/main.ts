import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Read version from package.json
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as {
    version: string;
  };

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Sales Planner API')
    .setDescription('NestJS API for sales planning and management')
    .setVersion(packageJson.version)
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
    customCssUrl: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css',
    ],
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${String(port)}`);
  console.log(`Swagger UI available at: http://localhost:${String(port)}/api`);
}

bootstrap();
