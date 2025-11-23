/**
 * Jest setup file
 * Runs before all tests to configure the test environment
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Set test database URL (can be overridden by actual .env.test file)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@/clubelo_test?host=/var/run/postgresql';

// Set test configuration
process.env.PORT = '3001'; // Use different port for tests
process.env.CLUBELO_API_BASE = 'http://api.clubelo.com';
