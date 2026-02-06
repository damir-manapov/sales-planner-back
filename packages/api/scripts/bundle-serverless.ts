import * as esbuild from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');

// Create entry point that imports from dist (which has decorator metadata)
const entryContent = `
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module.js';

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
`;

// Write temporary entry point in dist folder
const tempEntry = join(apiRoot, 'dist/serverless-entry.js');
writeFileSync(tempEntry, entryContent);

await esbuild.build({
  entryPoints: [tempEntry],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(apiRoot, 'api/index.bundle.mjs'),
  // Keep node_modules external - they'll be resolved from Vercel's node_modules
  packages: 'external',
  sourcemap: false,
  minify: false,
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
  },
});

console.log('✅ Bundled dist/ → api/index.bundle.mjs');
