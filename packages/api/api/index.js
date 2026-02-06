import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
// Import from pre-built dist folder (created by buildCommand before this runs)
import { AppModule } from '../dist/app.module.js';

const server = express();
let isAppInitialized = false;

export default async function handler(req, res) {
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
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
