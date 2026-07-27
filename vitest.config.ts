import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Set process.env vars for tests (loaded before any source code)
  // Note: the `env` block in Vitest only affects import.meta.env, not process.env.
  // Source code reads process.env, so we set it here and also via setupFiles.
  esbuild: {
    target: 'es2022',
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup-env.ts'],
    // Vitest 4: poolOptions moved to top-level test options
    // Single fork to avoid DB connection issues with singleton AppDataSource
    pool: 'forks',
    fileParallelism: false,
    // Tests within a file run sequentially
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/backend/**',
        'src/frontend/**',
        'src/ports/**',
        'src/types/**',
        'src/api/**',
        'src/infrastructure/database/data-source.ts',
        'src/infrastructure/qdrant/qdrant-client.ts',
        'src/domain/ast/visitor.ts',
      ],
      thresholds: {
        branches: 68,
        functions: 90,
        lines: 84,
        statements: 82,
      },
    },
  },
  resolve: {
    alias: {
      '@domain': './src/domain',
      '@engines': './src/engines',
      '@services': './src/services',
      '@ports': './src/ports',
      '@adapters': './src/adapters',
      '@infrastructure': './src/infrastructure',
    },
  },
});
