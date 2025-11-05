import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // Resolve internal workspace packages to source during tests
      '@ftr-mono/domain': path.resolve(__dirname, '../../packages/domain/src'),
      '@ftr-mono/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@ftr-mono/scheduler': path.resolve(__dirname, '../../packages/scheduler/src'),
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
