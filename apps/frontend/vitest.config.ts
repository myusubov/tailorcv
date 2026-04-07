/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, '../../packages/shared/src'),
      '@': path.resolve(__dirname, '.'),
    },
  },
});
