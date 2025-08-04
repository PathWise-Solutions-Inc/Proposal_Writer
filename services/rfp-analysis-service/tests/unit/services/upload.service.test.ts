import path from 'path';
import crypto from 'crypto';
import { UploadService } from '../../../src/services/upload.service';
import {
  createTestFile,
  createTestUser,
  createTestRfpData,
  createTempTestFile,
  cleanupTestFiles,
  expectError,
} from '../../utils/test-utils';
import {
  mockLogger,
  mockDatabaseService,
  mockTextExtractionService,
  mockAnalysisQueueService,
  mockFs,
  mockCrypto,
  resetAllMocks,
} from '../../mocks';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
jest.mock('../../../src/services/database.service', () => ({ databaseService: mockDatabaseService }));
jest.mock('../../../src/services/text-extraction.service', () => ({ textExtractionService: mockTextExtractionService }));
jest.mock('../../../src/services/analysis-queue.service', () => ({ analysisQueueService: mockAnalysisQueueService }));
jest.mock('fs-extra', () => mockFs);
jest.mock('crypto', () => mockCrypto);

describe('UploadService', () => {
  let uploadService: UploadService;
  let testUser: any;
  let testFile: Express.Multer.File;
  let tempFiles: string[] = [];

  beforeEach(() => {
    uploadService = new UploadService();
    testUser = createTestUser();
    testFile = createTestFile();
    resetAllMocks();
  });

  afterEach(async () => {
    await cleanupTestFiles(tempFiles);
    tempFiles = [];
  });

  describe('processUpload', () => {
    const validUploadOptions = {
      file: testFile,
      userId: testUser.id,
      organizationId: testUser.organizationId,
      metadata: {
        title: 'Test RFP',
        clientName: 'Test Client',
        dueDate: '2024-12-31',
        description: 'Test description',
      },
    };

    describe('successful upload', () => {
      beforeEach(() => {
        mockDatabaseService.findRfpByHash.mockResolvedValue(null);
        mockDatabaseService.createRfp.mockResolvedValue(createTestRfpData());
        mockTextExtractionService.extractText.mockResolvedValue(undefined);
        mockAnalysisQueueService.queueForAnalysis.mockResolvedValue(undefined);
      });

      it('should successfully process a new file upload', async () => {
        const result = await uploadService.processUpload(validUploadOptions);

        expect(result).toMatchObject({
          rfpId: expect.any(String),
          originalFileName: testFile.originalname,
          fileSize: testFile.size,
          fileHash: 'mock-hash-123',
          status: 'processing',
          message: 'RFP uploaded successfully and queued for analysis',
        });

        expect(mockFs.move).toHaveBeenCalledWith(
          testFile.path,
          expect.stringContaining(path.extname(testFile.originalname))
        );
        expect(mockDatabaseService.createRfp).toHaveBeenCalledWith(
          expect.objectContaining({
            title: validUploadOptions.metadata.title,
            clientName: validUploadOptions.metadata.clientName,
            organizationId: testUser.organizationId,
            uploadedById: testUser.id,
            status: 'uploaded',
          })
        );
        expect(mockTextExtractionService.extractText).toHaveBeenCalled();
        expect(mockAnalysisQueueService.queueForAnalysis).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
          'RFP upload processed successfully',
          expect.any(Object)
        );
      });

      it('should use original filename as title when title is not provided', async () => {
        const optionsWithoutTitle = {
          file: testFile,
          userId: testUser.id,
          organizationId: testUser.organizationId,
          metadata: {
            title: '',
            clientName: 'Test Client',
            dueDate: '2024-12-31',
            description: 'Test description',
          },
        };

        await uploadService.processUpload(optionsWithoutTitle);

        expect(mockDatabaseService.createRfp).toHaveBeenCalledWith(
          expect.objectContaining({
            title: testFile.originalname,
          })
        );
      });

      it('should handle optional metadata fields', async () => {
        const optionsWithMinimalMetadata = {
          file: testFile,
          userId: testUser.id,
          organizationId: testUser.organizationId,
          metadata: {
            title: 'Test RFP',
            clientName: 'Test Client',
          },
        };

        await uploadService.processUpload(optionsWithMinimalMetadata);

        expect(mockDatabaseService.createRfp).toHaveBeenCalledWith(
          expect.objectContaining({
            dueDate: null,
            description: undefined,
          })
        );
      });
    });

    describe('duplicate file handling', () => {
      it('should detect and handle duplicate files', async () => {
        const existingRfp = createTestRfpData({ status: 'analyzed' });
        mockDatabaseService.findRfpByHash.mockResolvedValue(existingRfp);

        const result = await uploadService.processUpload(validUploadOptions);

        expect(result).toMatchObject({
          rfpId: existingRfp.id,
          status: existingRfp.status,
          message: 'This RFP has already been uploaded',
        });

        expect(mockFs.remove).toHaveBeenCalledWith(testFile.path);
        expect(mockDatabaseService.createRfp).not.toHaveBeenCalled();
        expect(mockTextExtractionService.extractText).not.toHaveBeenCalled();
        expect(mockAnalysisQueueService.queueForAnalysis).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle database creation errors', async () => {
        mockDatabaseService.findRfpByHash.mockResolvedValue(null);
        mockDatabaseService.createRfp.mockRejectedValue(new Error('Database error'));

        await expectError(
          () => uploadService.processUpload(validUploadOptions),
          'Database error'
        );

        expect(mockFs.remove).toHaveBeenCalledWith(testFile.path);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error processing RFP upload',
          expect.any(Object)
        );
      });

      it('should handle text extraction errors', async () => {
        mockDatabaseService.findRfpByHash.mockResolvedValue(null);
        mockDatabaseService.createRfp.mockResolvedValue(createTestRfpData());
        mockTextExtractionService.extractText.mockRejectedValue(new Error('Extraction error'));

        await expectError(
          () => uploadService.processUpload(validUploadOptions),
          'Extraction error'
        );

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          expect.any(String),
          'error',
          { error: 'Extraction error' }
        );
      });

      it('should handle file system errors', async () => {
        mockDatabaseService.findRfpByHash.mockResolvedValue(null);
        mockFs.move.mockRejectedValue(new Error('File system error'));

        await expectError(
          () => uploadService.processUpload(validUploadOptions),
          'File system error'
        );

        expect(mockFs.remove).toHaveBeenCalled();
      });

      it('should handle cleanup errors gracefully', async () => {
        mockDatabaseService.findRfpByHash.mockResolvedValue(null);
        mockDatabaseService.createRfp.mockRejectedValue(new Error('Database error'));
        mockFs.pathExists.mockResolvedValue(true);
        mockFs.remove.mockRejectedValue(new Error('Cleanup error'));

        await expectError(
          () => uploadService.processUpload(validUploadOptions),
          'Database error'
        );

        // Should not throw cleanup error
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error processing RFP upload',
          expect.any(Object)
        );
      });
    });

    describe('file hash calculation', () => {
      it('should calculate SHA-256 hash correctly', async () => {
        const mockHash = {
          update: jest.fn().mockReturnThis(),
          digest: jest.fn().mockReturnValue('calculated-hash'),
        };
        const mockStream = {
          on: jest.fn<typeof mockStream, [string, (data?: any) => void]>((event: string, callback: (data?: any) => void) => {
            if (event === 'data') {
              callback(Buffer.from('test data'));
            } else if (event === 'end') {
              callback();
            }
            return mockStream;
          }),
        };

        mockCrypto.createHash.mockReturnValue(mockHash);
        mockFs.createReadStream.mockReturnValue(mockStream);
        mockDatabaseService.findRfpByHash.mockResolvedValue(null);
        mockDatabaseService.createRfp.mockResolvedValue(createTestRfpData());

        await uploadService.processUpload(validUploadOptions);

        expect(mockCrypto.createHash).toHaveBeenCalledWith('sha256');
        expect(mockHash.digest).toHaveBeenCalledWith('hex');
      });

      it('should handle hash calculation errors', async () => {
        const mockStream = {
          on: jest.fn<typeof mockStream, [string, (error?: Error) => void]>((event: string, callback: (error?: Error) => void) => {
            if (event === 'error') {
              callback(new Error('Hash calculation error'));
            }
            return mockStream;
          }),
        };

        mockFs.createReadStream.mockReturnValue(mockStream);

        await expectError(
          () => uploadService.processUpload(validUploadOptions),
          'Hash calculation error'
        );
      });
    });
  });

  describe('getUploadStatus', () => {
    it('should return RFP status when found', async () => {
      const testRfp = createTestRfpData({
        status: 'analyzed',
        analysisResults: { evaluationCriteria: [] },
      });
      mockDatabaseService.getRfpById.mockResolvedValue(testRfp);

      const result = await uploadService.getUploadStatus(testRfp.id);

      expect(result).toEqual({
        rfpId: testRfp.id,
        title: testRfp.title,
        status: testRfp.status,
        uploadedAt: testRfp.createdAt,
        analysisResults: testRfp.analysisResults,
        extractedText: true,
      });
    });

    it('should return null when RFP not found', async () => {
      mockDatabaseService.getRfpById.mockResolvedValue(null);

      const result = await uploadService.getUploadStatus('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockDatabaseService.getRfpById.mockRejectedValue(new Error('Database error'));

      await expectError(
        () => uploadService.getUploadStatus('test-id'),
        'Database error'
      );
    });

    it('should not include extractedText flag for non-analyzed RFPs', async () => {
      const testRfp = createTestRfpData({ status: 'processing' });
      mockDatabaseService.getRfpById.mockResolvedValue(testRfp);

      const result = await uploadService.getUploadStatus(testRfp.id);

      expect(result?.extractedText).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle extremely large file names', async () => {
      const longFileName = 'a'.repeat(300) + '.pdf';
      const fileWithLongName = createTestFile({ originalname: longFileName });
      
      const options = {
        ...validUploadOptions,
        file: fileWithLongName,
      };

      mockDatabaseService.findRfpByHash.mockResolvedValue(null);
      mockDatabaseService.createRfp.mockResolvedValue(createTestRfpData());

      const result = await uploadService.processUpload(options);

      expect(result.originalFileName).toBe(longFileName);
    });

    it('should handle special characters in file names', async () => {
      const specialFileName = 'test-file!@#$%^&*()_+{}:"<>?[]\';,.pdf';
      const fileWithSpecialChars = createTestFile({ originalname: specialFileName });
      
      const options = {
        ...validUploadOptions,
        file: fileWithSpecialChars,
      };

      mockDatabaseService.findRfpByHash.mockResolvedValue(null);
      mockDatabaseService.createRfp.mockResolvedValue(createTestRfpData());

      const result = await uploadService.processUpload(options);

      expect(result.originalFileName).toBe(specialFileName);
    });

    it('should handle concurrent uploads with same hash', async () => {
      const options = validUploadOptions;
      
      // First call returns null (no duplicate), second call returns existing RFP
      mockDatabaseService.findRfpByHash
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createTestRfpData());
      
      mockDatabaseService.createRfp
        .mockRejectedValueOnce(new Error('Duplicate key violation'))
        .mockResolvedValueOnce(createTestRfpData());

      // This would handle race conditions in a real implementation
      await expectError(
        () => uploadService.processUpload(options),
        'Duplicate key violation'
      );
    });
  });
});