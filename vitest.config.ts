import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts', './tests/vitest.setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'packages/**/*.{test,spec}.{ts,tsx}',
      'apps/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      'tests/e2e/**',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/**/src/**',
        'apps/web/src/**',
        'apps/workers/src/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@herafino/types': path.resolve(__dirname, './packages/types/src'),
      '@herafino/contracts': path.resolve(__dirname, './packages/contracts/src'),
      '@herafino/shared': path.resolve(__dirname, './packages/shared/src'),
      '@herafino/shared/*': path.resolve(__dirname, './packages/shared/src/*'),
    },
  },
});