const defineConfig = require('vitest/config').defineConfig;

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});