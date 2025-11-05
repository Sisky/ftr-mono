import { configDefaults, defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // During tests, resolve workspace packages to source to avoid needing pre-built dist
      '@ftr-mono/domain': path.resolve(__dirname, 'packages/domain/src'),
      '@ftr-mono/protocol': path.resolve(__dirname, 'packages/protocol/src'),
      '@ftr-mono/scheduler': path.resolve(__dirname, 'packages/scheduler/src'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        // Respect Vitest defaults
        ...(configDefaults.coverage?.exclude ?? configDefaults.exclude),
        // Protocol index is types-only
        'packages/protocol/src/index.ts',
      ],
    },
  },
});
