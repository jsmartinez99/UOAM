import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
       globals: {
        node: true,
        browser: true,
        process: true,
        console: true,
        localStorage: true,
        window: true,
        crypto: true,
        Buffer: true,
        File: true,
        FormData: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
];
