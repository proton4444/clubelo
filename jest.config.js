/**
 * Jest configuration for TypeScript testing
 *
 * This configuration enables:
 * - TypeScript test execution via ts-jest
 * - Unit tests for import logic and utilities
 * - Integration tests for API endpoints
 * - Code coverage reporting
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Node environment for server-side code
  testEnvironment: 'node',

  // Look for tests in src directory
  roots: ['<rootDir>/src'],

  // Test file patterns - matches:
  // - Files in __tests__ directories
  // - Files ending with .test.ts or .spec.ts
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // File extensions to consider
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage collection settings
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],

  // Coverage thresholds (optional - can be adjusted)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Timeout for tests (10 seconds for API tests)
  testTimeout: 10000,

  // Set environment variables for tests
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
};
