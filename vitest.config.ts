import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                ...configDefaults.coverage?.exclude ?? configDefaults.exclude,
                'packages/protocol/src/index.ts',   // types only
            ],
        }
    }
});
