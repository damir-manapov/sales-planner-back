import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
// @ts-ignore - Path is correct at runtime (dist/api/index.js -> dist/app.module.js)
import { AppModule } from '../app.module.js';

// Minimal interface for Express Response to avoid @types/express dependency in production
interface ServerlessResponse {
  status(code: number): { json(body: unknown): void };
}

const server = express();
let isAppInitialized = false;

export default async function handler(req: express.Request, res: express.Response) {
  try {
    if (!isAppInitialized) {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
      app.enableCors();

      await app.init();
      isAppInitialized = true;
    }
    server(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    (res as unknown as ServerlessResponse).status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
