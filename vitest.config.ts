import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    // Avec une base externe partagée (CI), on exécute les fichiers en série
    fileParallelism: !process.env.MONGO_TEST_URI,
    // Variables d'environnement minimales pour que src/config/env.ts
    // ne stoppe pas le process (la vraie connexion est faite par MongoMemoryServer).
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/visiplus_test',
      JWT_SECRET: 'test-secret-key-at-least-32-characters',
      JWT_EXPIRES_IN: '1h',
      // Limites hautes pour ne pas gêner les autres tests (security.test.ts teste le 429)
      RATE_LIMIT_MAX: '10000',
      AUTH_RATE_LIMIT_MAX: '10000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  esbuild: {
    target: 'node20',
  },
});
