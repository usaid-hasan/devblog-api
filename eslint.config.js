/* eslint-disable quote-props */
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import vitestPlugin from 'eslint-plugin-vitest';
import * as eslintRules from 'eslint-rules';

export default [
  { ignores: ['dist/**/*.js'] },
  {
    files: ['**/*.js'],
    plugins: {
      'import': importPlugin,
    },
    rules: {
      ...eslintRules.default,
      ...eslintRules.importPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
      },
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import/extensions': ['.js'],
      'import/parsers': { espree: ['.js'] },
      'import/ignore': [],
      'import/resolver': {
        'eslint-import-resolver-custom-alias': {
          alias: { '@/tests': './tests', '@': './src' },
          extensions: ['.js'],
        },
      },
    },
  },
  {
    files: ['**/__tests__/**/*.js'],
    plugins: {
      'vitest': vitestPlugin,
    },
    rules: {
      ...eslintRules.vitestPlugin,
    },
  },
  {
    files: ['**/__tests__/**/*.js', 'tests/*'],
    languageOptions: {
      globals: {
        db: 'readonly',
        client: 'readonly',
        server: 'readonly',
        query: 'readonly',
        ObjectId: 'readonly',
      },
    },
  },
];
