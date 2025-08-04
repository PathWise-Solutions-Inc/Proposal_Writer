#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

interface TestConfig {
  unitTests: boolean;
  integrationTests: boolean;
  e2eTests: boolean;
  coverage: boolean;
  watch: boolean;
  verbose: boolean;
  bail: boolean;
  detectOpenHandles: boolean;
}

class TestRunner {
  private config: TestConfig;

  constructor() {
    this.config = this.parseArgs();
  }

  private parseArgs(): TestConfig {
    const args = process.argv.slice(2);
    
    return {
      unitTests: !args.includes('--no-unit'),
      integrationTests: !args.includes('--no-integration'),
      e2eTests: !args.includes('--no-e2e'),
      coverage: args.includes('--coverage') || args.includes('-c'),
      watch: args.includes('--watch') || args.includes('-w'),
      verbose: args.includes('--verbose') || args.includes('-v'),
      bail: args.includes('--bail') || args.includes('-b'),
      detectOpenHandles: args.includes('--detect-open-handles'),
    };
  }

  private buildJestCommand(): string {
    const baseCmd = 'npx jest';
    const options: string[] = [];

    // Test patterns
    const testPatterns: string[] = [];
    if (this.config.unitTests) {
      testPatterns.push('tests/unit/**/*');
    }
    if (this.config.integrationTests) {
      testPatterns.push('tests/integration/**/*');
    }
    if (this.config.e2eTests) {
      testPatterns.push('tests/e2e/**/*');
    }

    if (testPatterns.length > 0) {
      options.push(`--testPathPattern="(${testPatterns.join('|')})`);
    }

    // Coverage
    if (this.config.coverage) {
      options.push('--coverage');
      options.push('--coverageReporters=text,lcov,html');
    }

    // Watch mode
    if (this.config.watch) {
      options.push('--watch');
    }

    // Verbose output
    if (this.config.verbose) {
      options.push('--verbose');
    }

    // Bail on first failure
    if (this.config.bail) {
      options.push('--bail');
    }

    // Detect open handles
    if (this.config.detectOpenHandles) {
      options.push('--detectOpenHandles');
    }

    // Performance options
    options.push('--maxWorkers=4');
    options.push('--testTimeout=30000');

    return `${baseCmd} ${options.join(' ')}`;
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');

    // Ensure test directories exist
    const testDirs = [
      'tests/unit',
      'tests/integration', 
      'tests/e2e',
      'tests/fixtures',
      'tests/utils',
      'tests/mocks',
      'coverage',
      '/tmp/test-uploads'
    ];

    for (const dir of testDirs) {
      await fs.ensureDir(path.resolve(dir));
    }

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
    process.env.UPLOAD_DIR = '/tmp/test-uploads';
    process.env.MAX_FILE_SIZE = '52428800'; // 50MB

    console.log('✅ Test environment setup complete');
  }

  private async cleanupTestEnvironment(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');

    try {
      // Clean up temp files
      await fs.remove('/tmp/test-uploads');
      await fs.remove('/tmp/proposal-writer-tests');
      
      // Clean up any leftover Jest cache
      await fs.remove('node_modules/.cache/jest');
    } catch (error) {
      console.warn('⚠️  Cleanup warning:', error instanceof Error ? error.message : String(error));
    }

    console.log('✅ Test environment cleanup complete');
  }

  private printTestSummary(): void {
    console.log('\n📊 Test Configuration Summary:');
    console.log(`   Unit Tests: ${this.config.unitTests ? '✅' : '❌'}`);
    console.log(`   Integration Tests: ${this.config.integrationTests ? '✅' : '❌'}`);
    console.log(`   E2E Tests: ${this.config.e2eTests ? '✅' : '❌'}`);
    console.log(`   Coverage: ${this.config.coverage ? '✅' : '❌'}`);
    console.log(`   Watch Mode: ${this.config.watch ? '✅' : '❌'}`);
    console.log(`   Verbose: ${this.config.verbose ? '✅' : '❌'}`);
    console.log('');
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting RFP Analysis Service Test Suite');
      
      this.printTestSummary();
      await this.setupTestEnvironment();

      const jestCommand = this.buildJestCommand();
      console.log(`📝 Running: ${jestCommand}\n`);

      // Execute Jest tests
      execSync(jestCommand, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      console.log('\n✅ All tests completed successfully!');

      if (this.config.coverage) {
        console.log('\n📈 Coverage report generated:');
        console.log('   - Text: Console output above');
        console.log('   - HTML: Open coverage/lcov-report/index.html');
        console.log('   - LCOV: coverage/lcov.info');
      }

    } catch (error) {
      console.error('\n❌ Tests failed!');
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    } finally {
      if (!this.config.watch) {
        await this.cleanupTestEnvironment();
      }
    }
  }

  static printHelp(): void {
    console.log(`
🧪 RFP Analysis Service Test Runner

Usage: npm run test [options]

Options:
  --no-unit           Skip unit tests
  --no-integration    Skip integration tests  
  --no-e2e           Skip end-to-end tests
  --coverage, -c     Generate coverage report
  --watch, -w        Run in watch mode
  --verbose, -v      Verbose output
  --bail, -b         Stop on first failure
  --detect-open-handles  Detect open handles
  --help, -h         Show this help

Examples:
  npm run test                    # Run all tests
  npm run test -- --coverage     # Run all tests with coverage
  npm run test -- --no-e2e       # Skip E2E tests
  npm run test -- --watch        # Run in watch mode
  npm run test:unit               # Run only unit tests
  npm run test:integration        # Run only integration tests
  npm run test:e2e               # Run only E2E tests
  npm run test:coverage          # Run all tests with coverage

Test Types:
  📋 Unit Tests       - Test individual functions and classes
  🔗 Integration Tests - Test API endpoints and middleware
  🎯 E2E Tests        - Test complete user workflows

For more information, see the test documentation in /tests/README.md
    `);
  }
}

// Handle command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    TestRunner.printHelp();
    process.exit(0);
  }

  const runner = new TestRunner();
  runner.run();
}

export { TestRunner };