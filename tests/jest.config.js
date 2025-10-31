module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setupEnv.ts'],
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    '../packages/shared/src/**/*.ts',
    '!../packages/shared/src/index.ts',
  ],
};

