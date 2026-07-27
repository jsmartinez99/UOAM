import { defineConfig } from 'vitest/config';

export default defineConfig({
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
      ],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
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
