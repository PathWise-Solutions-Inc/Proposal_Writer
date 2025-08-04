import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error for debugging
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.UPLOAD_DIR = '/tmp/test-uploads';
process.env.MAX_FILE_SIZE = '52428800'; // 50MB

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});