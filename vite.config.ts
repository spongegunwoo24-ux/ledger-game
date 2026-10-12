import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 4000,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
