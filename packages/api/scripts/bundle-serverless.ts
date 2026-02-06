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
  external: [
    // Don't bundle these - Vercel provides them or they have native bindings
    '@nestjs/microservices',
    '@nestjs/websockets',
    '@nestjs/platform-express',
    'class-transformer/storage',
    'class-transformer',
    'class-validator',
    'cache-manager',
    'ioredis',
    // Template engines that console-ninja tries to require
    'dustjs-linkedin',
    'twig',
    'hamlet',
    'whiskers',
    'hogan.js',
    'walrus',
    'mustache',
    'ractive',
    'htmling',
    'babel-core',
    'twing',
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
  // Handle __dirname/__filename for ESM
  define: {
    'import.meta.url': 'import.meta.url',
  },
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
