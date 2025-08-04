// Mock implementations for external dependencies

// Mock Winston logger
export const mockLogger = {
  info: jest.fn<void, [string, any?]>(),
  warn: jest.fn<void, [string, any?]>(),
  error: jest.fn<void, [string, any?]>(),
  debug: jest.fn<void, [string, any?]>(),
};

// Mock database service
export const mockDatabaseService = {
  findRfpByHash: jest.fn(),
  createRfp: jest.fn(),
  updateRfpStatus: jest.fn(),
  getRfpById: jest.fn(),
};

// Mock text extraction service
export const mockTextExtractionService = {
  extractText: jest.fn(),
};

// Mock analysis queue service
export const mockAnalysisQueueService = {
  queueForAnalysis: jest.fn(),
};

// Mock fs-extra
export const mockFs = {
  ensureDir: jest.fn().mockResolvedValue(undefined),
  ensureDirSync: jest.fn(),
  move: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  createReadStream: jest.fn(),
  stat: jest.fn().mockResolvedValue({ size: 1024 }),
};

// Mock crypto
export const mockCrypto = {
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash-123'),
  })),
};

// Mock pdf-parse
export const mockPdfParse = jest.fn().mockResolvedValue({
  text: 'Extracted PDF text content',
  numpages: 1,
  numrender: 1,
  info: {},
  metadata: {},
  version: '1.4',
});

// Mock Bull queue
export const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  process: jest.fn(),
  on: jest.fn(),
  clean: jest.fn(),
  getJob: jest.fn(),
  getJobCounts: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }),
};

// Mock TypeORM data source
export const mockAppDataSource = {
  getRepository: jest.fn(() => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    })),
  })),
  initialize: jest.fn().mockResolvedValue(undefined),
  isInitialized: true,
};

// Mock JWT
export const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    organizationId: 'org-123',
  }),
};

// Helper to reset all mocks
export const resetAllMocks = (): void => {
  Object.values(mockLogger).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  Object.values(mockDatabaseService).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  Object.values(mockTextExtractionService).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  Object.values(mockAnalysisQueueService).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  Object.values(mockFs).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  Object.values(mockCrypto).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  mockPdfParse.mockReset();
  Object.values(mockQueue).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
  Object.values(mockJwt).forEach((mock: jest.MockedFunction<any>) => mock.mockReset());
};