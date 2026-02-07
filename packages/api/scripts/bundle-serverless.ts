import * as esbuild from 'esbuild';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, unlinkSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');
const repoRoot = join(apiRoot, '../..');

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(apiRoot, 'package.json'), 'utf-8'));
const APP_VERSION = packageJson.version;

// Create entry point that imports from dist (which has decorator metadata)
const entryContent = `
import 'reflect-metadata';
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

try {
  await esbuild.build({
    entryPoints: [tempEntry],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    // Output to repo root so it can find node_modules
    outfile: join(repoRoot, 'api/index.mjs'),
    // Bundle everything - no external packages
    // This avoids node_modules resolution issues
    external: [
      // Only keep truly optional/problematic packages external
      '@nestjs/microservices',
      '@nestjs/websockets',
      '@nestjs/platform-socket.io',
      'class-transformer/storage',
      'class-transformer',
      'class-validator',
      'cache-manager',
      'ioredis',
      // Native modules that can't be bundled
      'pg-native',
    ],
    sourcemap: false,
    minify: false,
    // Inject version at build time
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION),
    },
    // Ignore console-ninja VS Code extension
    plugins: [
      {
        name: 'ignore-extensions',
        setup(build) {
          build.onResolve({ filter: /console-ninja|wallabyjs/ }, () => ({
            path: 'empty',
            namespace: 'empty',
          }));
          build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({
            contents: 'export default {}',
          }));
        },
      },
    ],
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
  console.log('✅ Bundled dist/ → api/index.mjs');
} finally {
  unlinkSync(tempEntry);
}
