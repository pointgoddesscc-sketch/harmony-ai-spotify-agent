import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.js'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/**/*.js', 'api/**/*.js']
    }
  }
});
