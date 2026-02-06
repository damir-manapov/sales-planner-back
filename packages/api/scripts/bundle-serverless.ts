import * as esbuild from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');

// Read the entry point
const entryContent = readFileSync(join(apiRoot, 'api/index.ts'), 'utf-8');

// Transform: change import from ../src/app.module.js to ../dist/app.module.js
const transformedContent = entryContent.replace(
  /from ['"]\.\.\/src\/app\.module\.js['"]/,
  "from '../dist/app.module.js'"
);

// Write a temporary file
const tempEntry = join(apiRoot, 'api/index.temp.ts');
writeFileSync(tempEntry, transformedContent);

try {
  await esbuild.build({
    entryPoints: [tempEntry],
    bundle: false, // Don't bundle - just compile TS to JS
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: join(apiRoot, 'api/index.bundle.mjs'),
    sourcemap: false,
    minify: false,
  });
  console.log('✅ Compiled api/index.ts → api/index.bundle.mjs');
} finally {
  // Clean up temp file
  const { unlinkSync } = await import('fs');
  unlinkSync(tempEntry);
}
