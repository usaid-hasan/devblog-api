import { env } from 'node:process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('vite').UserConfig} */
export default {
  build: {
    ssr: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        server: './src/index.js',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@\/tests(?<path>.*)/,
        replacement: resolve(dirname(fileURLToPath(import.meta.url)), './tests/$1'),
      },
      {
        find: /^@\/(?<path>.*)/,
        replacement: resolve(dirname(fileURLToPath(import.meta.url)), './src/$1'),
      },
    ],
  },
  define: {
    'import.meta.env.TEST': env.NODE_ENV === 'test',
  },
  test: {
    name: 'api tests',
    include: ['./__tests__/**/*.test.js'],
    threads: false,
    singleThread: true,
    setupFiles: ['./tests/setup-file.js'],
    globalSetup: ['./tests/global-setup.js'],
    bail: 1,
  },
};
