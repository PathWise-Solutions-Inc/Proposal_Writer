# RFP Analysis Service Test Suite

This directory contains comprehensive tests for the RFP Analysis Engine, following the test pyramid pattern with unit tests, integration tests, and end-to-end tests.

## 📁 Directory Structure

```
tests/
├── README.md                          # This file
├── setup.ts                          # Global test setup and configuration
├── run-tests.ts                      # Custom test runner with advanced options
├── fixtures/                         # Test data and sample files
│   ├── sample-rfp.txt               # Sample RFP document for testing
│   ├── test-data.json               # Test data fixtures and scenarios
│   └── create-test-files.ts         # Utility to generate test files
├── mocks/                           # Mock implementations
│   └── index.ts                     # Centralized mocks for all dependencies
├── utils/                           # Test utilities and helpers
│   └── test-utils.ts               # Common test utilities and factories
├── unit/                            # Unit tests (testing individual components)
│   └── services/
│       ├── upload.service.test.ts   # Upload service unit tests
│       ├── text-extraction.service.test.ts  # Text extraction unit tests
│       └── database.service.test.ts  # Database service unit tests
├── integration/                     # Integration tests (testing API endpoints)
│   └── controllers/
│       └── upload.controller.test.ts # Upload controller integration tests
└── e2e/                            # End-to-end tests (testing complete workflows)
    └── upload-flow.test.ts         # Complete upload flow E2E tests
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch

# Debug mode with verbose output
npm run test:debug
```

### Advanced Test Runner Options

```bash
# Run custom combinations
npm test -- --no-e2e              # Skip E2E tests
npm test -- --coverage            # Generate coverage report
npm test -- --watch               # Watch mode
npm test -- --verbose             # Verbose output
npm test -- --bail                # Stop on first failure
npm test -- --detect-open-handles # Debug hanging tests
```

## 🧪 Test Categories

### Unit Tests (`tests/unit/`)

Test individual functions, classes, and services in isolation.

**Coverage:**
- ✅ Upload Service - File validation, deduplication, hash calculation
- ✅ Text Extraction Service - PDF/text processing, error handling  
- ✅ Database Service - CRUD operations, query handling

**Key Features Tested:**
- File hash calculation and duplicate detection
- File size and type validation
- PDF text extraction with pdf-parse
- Text file processing
- Database entity operations
- Error handling and cleanup
- Edge cases (large files, special characters, concurrent operations)

### Integration Tests (`tests/integration/`)

Test API endpoints with middleware and authentication.

**Coverage:**
- ✅ Upload Controller - Complete HTTP request/response cycle
- ✅ Authentication Middleware - JWT token validation
- ✅ File Upload Validation - Multer integration
- ✅ Error Handling - Proper HTTP status codes

**Key Features Tested:**
- File upload with authentication
- Request validation and sanitization
- Error responses and status codes
- Duplicate file handling
- Async processing triggers
- Real file upload scenarios

### End-to-End Tests (`tests/e2e/`)

Test complete user workflows from start to finish.

**Coverage:**
- ✅ Complete Upload Flow - Upload → Processing → Analysis → Status Check
- ✅ Authentication Flow - Token validation across requests
- ✅ Error Scenarios - Database failures, file system errors
- ✅ Real File Processing - Actual PDF and text files

**Key Features Tested:**
- Multi-step workflow validation
- Status tracking through lifecycle
- Real file upload and processing
- Error recovery and cleanup
- Security and validation
- Performance under load

## 📊 Coverage Goals

- **Unit Tests**: 90%+ coverage of service layer
- **Integration Tests**: 80%+ coverage of controller layer  
- **E2E Tests**: 100% coverage of critical user paths

Current coverage targets:
- Functions: 85%+
- Lines: 80%+
- Branches: 75%+
- Statements: 80%+

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
};
```

### Environment Variables

Test-specific environment variables are set in `tests/setup.ts`:

```typescript
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.UPLOAD_DIR = '/tmp/test-uploads';
process.env.MAX_FILE_SIZE = '52428800'; // 50MB
```

## 🛠 Test Utilities

### Test Data Factories

```typescript
// Create test users, files, and RFP data
const testUser = createTestUser();
const testFile = createTestFile();
const testRfp = createTestRfpData();
```

### File Creation Utilities

```typescript
// Generate test files of different types
const pdfPath = await createTestPDF();
const textPath = await createTestTXT();
const largePath = await createLargeFile(60); // 60MB file
```

### Mock Management

```typescript
// Reset all mocks between tests
import { resetAllMocks } from '../mocks';
beforeEach(() => resetAllMocks());
```

## 🎯 Testing Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('should upload RFP successfully', async () => {
  // Arrange
  const testFile = createTestFile();
  const uploadOptions = { file: testFile, userId: 'user-123' };
  
  // Act
  const result = await uploadService.processUpload(uploadOptions);
  
  // Assert
  expect(result.status).toBe('processing');
});
```

### 2. Descriptive Test Names

- ✅ `should reject files larger than 50MB`
- ✅ `should detect duplicate uploads using SHA-256 hash`
- ❌ `test file upload`

### 3. Test Isolation

- Each test cleans up after itself
- No shared state between tests
- Independent test data

### 4. Error Testing

```typescript
// Test both success and failure scenarios
await expectError(
  () => uploadService.processUpload(invalidOptions),
  'Expected error message'
);
```

### 5. Edge Cases

- Empty files
- Maximum file sizes
- Special characters in filenames
- Concurrent operations
- Network failures

## 🚦 Continuous Integration

### Test Pipeline Stages

1. **Lint and Type Check**
   ```bash
   npm run lint
   npm run typecheck
   ```

2. **Unit Tests** (Fast feedback)
   ```bash
   npm run test:unit
   ```

3. **Integration Tests** (API validation)
   ```bash
   npm run test:integration
   ```

4. **E2E Tests** (Critical path validation)
   ```bash
   npm run test:e2e
   ```

5. **Coverage Report**
   ```bash
   npm run test:coverage
   ```

### GitHub Actions Integration

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## 🐛 Debugging Tests

### Common Issues

1. **Open Handles Warning**
   ```bash
   npm run test:debug  # Detects open handles
   ```

2. **Timeout Issues**
   ```typescript
   // Increase timeout for slow tests
   jest.setTimeout(60000);
   ```

3. **Mock Issues**
   ```typescript
   // Reset mocks between tests
   beforeEach(() => jest.clearAllMocks());
   ```

4. **File System Issues**
   ```typescript
   // Ensure cleanup in finally blocks
   afterEach(async () => {
     await cleanupTestFiles(tempFiles);
   });
   ```

### Debugging Commands

```bash
# Run single test file
npx jest tests/unit/services/upload.service.test.ts

# Run tests matching pattern
npx jest --testNamePattern="should handle PDF files"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Watch specific files
npx jest --watch tests/unit/services/
```

## 📈 Performance Testing

### Load Testing Example

```typescript
it('should handle concurrent uploads', async () => {
  const concurrentUploads = 10;
  const promises = Array.from({ length: concurrentUploads }, () =>
    uploadService.processUpload(testOptions)
  );
  
  const results = await Promise.all(promises);
  expect(results.length).toBe(concurrentUploads);
});
```

### Memory Usage Monitoring

```typescript
// Monitor memory usage in tests
const memBefore = process.memoryUsage();
await uploadService.processLargeFile(largeFile);
const memAfter = process.memoryUsage();
expect(memAfter.heapUsed - memBefore.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
```

## 🔐 Security Testing

### Input Validation

```typescript
it('should sanitize malicious input', async () => {
  const maliciousInput = {
    title: '<script>alert("xss")</script>',
    clientName: 'Client & Associates <test>',
  };
  
  const result = await uploadService.processUpload({
    file: testFile,
    metadata: maliciousInput,
  });
  
  expect(result.sanitizedData).not.toContain('<script>');
});
```

### Authentication Testing

```typescript
it('should reject requests without valid JWT', async () => {
  const response = await request(app)
    .post('/upload')
    .attach('file', testFile);
    
  expect(response.status).toBe(401);
});
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest API](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [TypeScript Testing Guide](https://kulshekhar.github.io/ts-jest/)

## 🤝 Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Maintain coverage** above 80%
3. **Test edge cases** and error scenarios
4. **Update test documentation** as needed
5. **Run full test suite** before submitting PR

### Test Checklist

- [ ] Unit tests for new functions/classes
- [ ] Integration tests for new endpoints
- [ ] E2E tests for new user workflows
- [ ] Error scenarios covered
- [ ] Edge cases tested
- [ ] Mocks updated if needed
- [ ] Documentation updated
- [ ] Coverage maintained

---

🎯 **Goal**: Ensure the RFP Analysis Engine is robust, reliable, and ready for production use through comprehensive testing at all levels.