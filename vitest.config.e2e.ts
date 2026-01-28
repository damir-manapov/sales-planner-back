import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e.spec.ts', 'test/**/*.e2e.test.ts'],
    testTimeout: 30000,
  },
  plugins: [swc.vite()],
});
