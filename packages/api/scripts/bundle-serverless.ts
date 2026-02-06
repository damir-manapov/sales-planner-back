import * as esbuild from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');

await esbuild.build({
  entryPoints: [join(apiRoot, 'api/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(apiRoot, 'api/index.bundle.mjs'),
  // Keep node_modules external but bundle workspace packages
  external: [
    // NestJS and related
    '@nestjs/*',
    'reflect-metadata',
    'rxjs',
    'rxjs/*',
    // Database
    'kysely',
    'pg',
    'pg-native',
    // Express
    'express',
    'body-parser',
    'cookie-parser',
    // Validation
    'class-validator',
    'class-transformer',
    'class-transformer/*',
    // Other common packages
    'uuid',
    'bcrypt',
    'jsonwebtoken',
    'dotenv',
    'iterare',
    'tslib',
    'path-to-regexp',
    'fast-safe-stringify',
    // Optional/peer dependencies
    '@nestjs/microservices',
    '@nestjs/websockets',
    'cache-manager',
    'ioredis',
  ],
  // Ignore console-ninja VS Code extension files
  plugins: [{
    name: 'ignore-console-ninja',
    setup(build) {
      build.onResolve({ filter: /console-ninja|wallabyjs/ }, () => ({
        path: 'empty',
        namespace: 'empty',
      }));
      build.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({
        contents: 'export default {}',
      }));
    },
  }],
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

console.log('✅ Bundled api/index.ts → api/index.bundle.mjs');
