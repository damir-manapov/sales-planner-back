import { config } from 'dotenv';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// Load environment variables before tests run
// Use .env.test.local for local PostgreSQL (docker-compose), .env.local for Neon
const envFile = process.env.USE_LOCAL_DB ? '.env.test.local' : '.env.local';
config({ path: envFile });

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['tests/**/*.e2e.spec.ts', 'tests/**/*.e2e.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  plugins: [swc.vite()],
});
