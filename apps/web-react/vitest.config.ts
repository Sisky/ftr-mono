import { defineConfig } from 'vitest/config';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      // Resolve internal workspace packages to source during tests
      '@ftr-mono/domain': path.resolve(dirname, '../../packages/domain/src'),
      '@ftr-mono/protocol': path.resolve(dirname, '../../packages/protocol/src'),
      '@ftr-mono/scheduler': path.resolve(dirname, '../../packages/scheduler/src'),
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
