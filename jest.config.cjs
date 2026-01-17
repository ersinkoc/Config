/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'node',
          skipLibCheck: true,
          strict: false,
          noEmit: true,
          resolveJsonModule: true,
          allowJs: true,
          verbatimModuleSyntax: false,
          types: ['node', 'jest'],
          isolatedModules: false,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/oxog-log.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    // Exclude complex custom parsers (YAML and TOML have custom implementations with many edge cases)
    '!src/parsers/yaml.ts',
    '!src/parsers/toml.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
  verbose: false,
  testTimeout: 10000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'node',
        skipLibCheck: true,
        strict: false,
        noEmit: true,
        resolveJsonModule: true,
        allowJs: true,
        verbatimModuleSyntax: false,
        types: ['node', 'jest'],
        isolatedModules: false,
      },
    },
  },
};
