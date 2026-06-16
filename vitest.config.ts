import { fileURLToPath } from 'node:url';

import swc from 'unplugin-swc';

import { defineConfig } from 'vitest/config';

/**
 * Vitest runs on esbuild by default, which strips TypeScript decorators
 * WITHOUT emitting the metadata that NestJS DI and class-validator need.
 * swc transpiles instead, with LEGACY decorators + decorator metadata enabled.
 *
 * `setupFiles` loads the `reflect-metadata` polyfill once before any test.
 * `resolve.alias` mirrors the tsconfig `@/*` path so tests can import via `@/`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.spec.ts'],
    setupFiles: ['reflect-metadata'],
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
      module: { type: 'es6' },
    }),
  ],
});
