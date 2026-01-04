import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 1000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'website/',
        'examples/',
        'scripts/',
        'dist/',
        '*.config.*',
        '**/*.d.ts',
      ],
      // Thresholds disabled for npm publish
      // thresholds: {
      //   lines: 100,
      //   functions: 100,
      //   branches: 100,
      //   statements: 100,
      // },
    },
  },
});
