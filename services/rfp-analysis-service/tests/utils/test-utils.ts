import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Test user factory
export const createTestUser = (overrides: Record<string, any> = {}) => ({
  id: uuidv4(),
  email: 'test@example.com',
  role: 'user',
  organizationId: uuidv4(),
  ...overrides,
});

// Test JWT token factory
export const createTestToken = (user: ReturnType<typeof createTestUser> = createTestUser()): string => {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

// Test file factory
export const createTestFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'rfpDocument',
  originalname: 'test-rfp.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  destination: '/tmp/test-uploads',
  filename: `${uuidv4()}.pdf`,
  path: `/tmp/test-uploads/${uuidv4()}.pdf`,
  size: 1024 * 100, // 100KB
  buffer: Buffer.from('test file content'),
  stream: null as any,
  ...overrides,
});

// Test RFP data factory
export const createTestRfpData = (overrides: Record<string, any> = {}) => ({
  id: uuidv4(),
  title: 'Test RFP Document',
  clientName: 'Test Client',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  description: 'Test RFP description',
  organizationId: uuidv4(),
  uploadedById: uuidv4(),
  status: 'uploaded' as const,
  extractedText: 'Sample extracted text',
  analysisResults: {
    evaluationCriteria: [],
    requirements: [],
    keyDates: [],
    budgetRange: {}
  },
  metadata: {
    originalFileName: 'test-rfp.pdf',
    fileSize: 1024 * 100,
    fileHash: 'test-hash-123',
    filePath: '/tmp/test-uploads/test-file.pdf',
    mimeType: 'application/pdf',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// File system test utilities
export const createTempTestFile = async (
  content: string = 'Test file content',
  filename: string = 'test-file.txt'
): Promise<string> => {
  const tempDir = '/tmp/test-uploads';
  await fs.ensureDir(tempDir);
  const filePath = path.join(tempDir, filename);
  await fs.writeFile(filePath, content);
  return filePath;
};

export const createTempPdfFile = async (): Promise<string> => {
  // Minimal PDF content for testing
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000220 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
320
%%EOF`;

  return createTempTestFile(pdfContent, 'test.pdf');
};

export const cleanupTestFiles = async (filePaths: string[]) => {
  for (const filePath of filePaths) {
    try {
      await fs.remove(filePath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
};

// Request mock factory
export const createMockRequest = (overrides: Record<string, any> = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  user: createTestUser(),
  file: null,
  ...overrides,
});

// Response mock factory
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn<any, [number]>().mockReturnValue(res);
  res.json = jest.fn<any, [any]>().mockReturnValue(res);
  res.send = jest.fn<any, [any]>().mockReturnValue(res);
  return res;
};

// Next function mock
export const createMockNext = (): jest.MockedFunction<() => void> => jest.fn();

// Database repository mock factory
export const createMockRepository = () => ({
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
});

// Error testing utilities
export const expectError = async (
  asyncFn: () => Promise<any>,
  expectedMessage?: string
): Promise<Error> => {
  try {
    await asyncFn();
    throw new Error('Expected function to throw an error');
  } catch (error: unknown) {
    const typedError = error as Error;
    if (expectedMessage) {
      expect(typedError.message).toContain(expectedMessage);
    }
    return typedError;
  }
};