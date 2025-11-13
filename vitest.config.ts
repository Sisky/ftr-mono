import { configDefaults, defineConfig } from 'vitest/config';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use explicit __filename/dirname variables to avoid TS name conflicts with Node globals
const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      // During tests, resolve workspace packages to source to avoid needing pre-built dist
      '@ftr-mono/domain': path.resolve(dirname, 'packages/domain/src'),
      '@ftr-mono/protocol': path.resolve(dirname, 'packages/protocol/src'),
      '@ftr-mono/scheduler': path.resolve(dirname, 'packages/scheduler/src'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        ...(configDefaults.coverage?.exclude ?? configDefaults.exclude),
        'packages/protocol/src/index.ts',
      ],
    },
  },
});
