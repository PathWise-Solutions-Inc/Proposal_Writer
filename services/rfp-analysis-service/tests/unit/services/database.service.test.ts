import {
  mockLogger,
  mockAppDataSource,
  resetAllMocks,
} from '../../mocks';
import { DatabaseService } from '../../../src/services/database.service';
import { RFP } from '../../../../auth-service/src/models/RFP';
import {
  createTestRfpData,
  createTestUser,
  expectError,
} from '../../utils/test-utils';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
jest.mock('../../../src/config/database', () => ({
  AppDataSource: mockAppDataSource,
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockRepository: any;

  beforeEach(() => {
    databaseService = new DatabaseService();
    mockRepository = {
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
    };
    mockAppDataSource.getRepository.mockReturnValue(mockRepository);
    resetAllMocks();
  });

  describe('findRfpByHash', () => {
    const testFileHash = 'abc123def456';
    const testOrgId = 'org-123';

    it('should find RFP by hash and organization ID', async () => {
      const expectedRfp = createTestRfpData({
        organizationId: testOrgId,
        metadata: { fileHash: testFileHash },
      });
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(expectedRfp);

      const result = await databaseService.findRfpByHash(testFileHash, testOrgId);

      expect(mockAppDataSource.getRepository).toHaveBeenCalledWith(RFP);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('rfp');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "rfp.metadata->>'fileHash' = :fileHash",
        { fileHash: testFileHash }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'rfp.organizationId = :organizationId',
        { organizationId: testOrgId }
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toEqual(expectedRfp);
    });

    it('should return null when no RFP is found', async () => {
      const mockQueryBuilder = mockRepository.createQueryBuilder();
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await databaseService.findRfpByHash(testFileHash, testOrgId);

      expect(result).toBeNull();
    });

    it('should handle database query errors', async () => {
      const dbError = new Error('Database connection failed');
      mockRepository.findOne.mockRejectedValue(dbError);

      await expectError(
        () => databaseService.findRfpByHash(testFileHash, testOrgId),
        'Database connection failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error finding RFP by hash',
        {
          error: dbError,
          fileHash: testFileHash,
          organizationId: testOrgId,
        }
      );
    });

    it('should handle empty hash values', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await databaseService.findRfpByHash('', testOrgId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          'metadata.fileHash': '',
          organizationId: testOrgId,
        },
      });
      expect(result).toBeNull();
    });

    it('should handle empty organization ID', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await databaseService.findRfpByHash(testFileHash, '');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          'metadata.fileHash': testFileHash,
          organizationId: '',
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('createRfp', () => {
    const testRfpData = createTestRfpData();

    it('should create and save a new RFP', async () => {
      const createdRfp = { ...testRfpData };
      const savedRfp = { ...testRfpData, id: 'saved-id' };

      mockRepository.create.mockReturnValue(createdRfp);
      mockRepository.save.mockResolvedValue(savedRfp);

      const result = await databaseService.createRfp(testRfpData);

      expect(mockAppDataSource.getRepository).toHaveBeenCalledWith(RFP);
      expect(mockRepository.create).toHaveBeenCalledWith(testRfpData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdRfp);
      expect(result).toEqual(savedRfp);
    });

    it('should handle creation errors', async () => {
      const createError = new Error('Validation failed');
      mockRepository.create.mockReturnValue(testRfpData);
      mockRepository.save.mockRejectedValue(createError);

      await expectError(
        () => databaseService.createRfp(testRfpData),
        'Validation failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating RFP',
        {
          error: createError,
          data: testRfpData,
        }
      );
    });

    it('should handle unique constraint violations', async () => {
      const constraintError = new Error('duplicate key value violates unique constraint');
      mockRepository.create.mockReturnValue(testRfpData);
      mockRepository.save.mockRejectedValue(constraintError);

      await expectError(
        () => databaseService.createRfp(testRfpData),
        'duplicate key value violates unique constraint'
      );
    });

    it('should create RFP with minimal required data', async () => {
      const minimalData = {
        title: 'Test RFP',
        clientName: 'Test Client',
        organizationId: 'org-123',
        uploadedById: 'user-123',
      };

      mockRepository.create.mockReturnValue(minimalData);
      mockRepository.save.mockResolvedValue({ ...minimalData, id: 'new-id' });

      const result = await databaseService.createRfp(minimalData);

      expect(mockRepository.create).toHaveBeenCalledWith(minimalData);
      expect(result).toEqual({ ...minimalData, id: 'new-id' });
    });

    it('should create RFP with complex metadata', async () => {
      const complexData = {
        ...testRfpData,
        metadata: {
          originalFileName: 'complex-rfp.pdf',
          fileSize: 2048576,
          fileHash: 'complex-hash',
          customFields: {
            department: 'IT',
            priority: 'high',
            tags: ['urgent', 'government'],
          },
        },
      };

      mockRepository.create.mockReturnValue(complexData);
      mockRepository.save.mockResolvedValue({ ...complexData, id: 'complex-id' });

      const result = await databaseService.createRfp(complexData);

      expect(result.metadata).toEqual(complexData.metadata);
    });
  });

  describe('updateRfpStatus', () => {
    const testRfpId = 'rfp-123';
    const testStatus = 'processing';

    it('should update RFP status without additional data', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus(testRfpId, testStatus);

      expect(mockAppDataSource.getRepository).toHaveBeenCalledWith(RFP);
      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: testRfpId },
        { status: testStatus }
      );
    });

    it('should update RFP status with additional data', async () => {
      const additionalData = {
        extractedText: 'Some extracted text',
        textExtractedAt: new Date(),
      };
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus(testRfpId, testStatus, additionalData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: testRfpId },
        {
          status: testStatus,
          metadata: additionalData,
        }
      );
    });

    it('should handle update errors', async () => {
      const updateError = new Error('RFP not found');
      mockRepository.update.mockRejectedValue(updateError);

      await expectError(
        () => databaseService.updateRfpStatus(testRfpId, testStatus),
        'RFP not found'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error updating RFP status',
        {
          error: updateError,
          rfpId: testRfpId,
          status: testStatus,
        }
      );
    });

    it('should handle empty additional data', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus(testRfpId, testStatus, {});

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: testRfpId },
        {
          status: testStatus,
          metadata: {},
        }
      );
    });

    it('should handle null additional data', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus(testRfpId, testStatus, null);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: testRfpId },
        { status: testStatus }
      );
    });

    it('should update to error status with error details', async () => {
      const errorData = {
        error: 'Text extraction failed',
        errorTimestamp: new Date(),
        retryCount: 1,
      };
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus(testRfpId, 'error', errorData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: testRfpId },
        {
          status: 'error',
          metadata: errorData,
        }
      );
    });

    it('should update to analyzed status with analysis results', async () => {
      const analysisData = {
        analysisResults: {
          evaluationCriteria: [
            { criterion: 'Experience', weight: 30, description: 'Years of experience' },
          ],
          requirements: [
            { id: 'req-1', text: 'Must have 5+ years', category: 'experience', mandatory: true },
          ],
        },
        analyzedAt: new Date(),
      };
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus(testRfpId, 'analyzed', analysisData);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: testRfpId },
        {
          status: 'analyzed',
          metadata: analysisData,
        }
      );
    });
  });

  describe('getRfpById', () => {
    const testRfpId = 'rfp-123';

    it('should find RFP by ID', async () => {
      const expectedRfp = createTestRfpData({ id: testRfpId });
      mockRepository.findOne.mockResolvedValue(expectedRfp);

      const result = await databaseService.getRfpById(testRfpId);

      expect(mockAppDataSource.getRepository).toHaveBeenCalledWith(RFP);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: testRfpId },
      });
      expect(result).toEqual(expectedRfp);
    });

    it('should return null when RFP is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await databaseService.getRfpById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database query errors', async () => {
      const queryError = new Error('Connection timeout');
      mockRepository.findOne.mockRejectedValue(queryError);

      await expectError(
        () => databaseService.getRfpById(testRfpId),
        'Connection timeout'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting RFP by ID',
        {
          error: queryError,
          rfpId: testRfpId,
        }
      );
    });

    it('should handle empty ID', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await databaseService.getRfpById('');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '' },
      });
      expect(result).toBeNull();
    });

    it('should handle UUID format IDs', async () => {
      const uuidRfpId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedRfp = createTestRfpData({ id: uuidRfpId });
      mockRepository.findOne.mockResolvedValue(expectedRfp);

      const result = await databaseService.getRfpById(uuidRfpId);

      expect(result).toEqual(expectedRfp);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle repository injection failures', async () => {
      mockAppDataSource.getRepository.mockImplementation(() => {
        throw new Error('Repository not found');
      });

      await expectError(
        () => databaseService.findRfpByHash('hash', 'org'),
        'Repository not found'
      );
    });

    it('should handle concurrent database operations', async () => {
      const testData = createTestRfpData();
      
      // Simulate concurrent operations
      const promises = [
        databaseService.createRfp(testData),
        databaseService.getRfpById(testData.id),
        databaseService.updateRfpStatus(testData.id, 'processing'),
      ];

      mockRepository.create.mockReturnValue(testData);
      mockRepository.save.mockResolvedValue(testData);
      mockRepository.findOne.mockResolvedValue(testData);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockAppDataSource.getRepository).toHaveBeenCalledTimes(3);
    });

    it('should handle large metadata objects', async () => {
      const largeMetadata = {
        largeArray: new Array(1000).fill('test data'),
        complexObject: {
          level1: {
            level2: {
              level3: 'deep nested value',
            },
          },
        },
      };
      
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await databaseService.updateRfpStatus('rfp-123', 'processing', largeMetadata);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { id: 'rfp-123' },
        {
          status: 'processing',
          metadata: largeMetadata,
        }
      );
    });

    it('should handle special characters in search parameters', async () => {
      const specialHash = "hash'with\"special;chars--and/*comments*/";
      const specialOrgId = "org-123'--union-select";
      
      mockRepository.findOne.mockResolvedValue(null);

      const result = await databaseService.findRfpByHash(specialHash, specialOrgId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          'metadata.fileHash': specialHash,
          organizationId: specialOrgId,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('performance and monitoring', () => {
    it('should log appropriate information for successful operations', async () => {
      const testRfp = createTestRfpData();
      mockRepository.create.mockReturnValue(testRfp);
      mockRepository.save.mockResolvedValue(testRfp);

      await databaseService.createRfp(testRfp);

      // Verify that no unexpected logging occurred (only error logging is implemented)
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle database timeouts gracefully', async () => {
      const timeoutError = new Error('Query timeout');
      timeoutError.name = 'QueryTimeoutError';
      mockRepository.findOne.mockRejectedValue(timeoutError);

      await expectError(
        () => databaseService.getRfpById('rfp-123'),
        'Query timeout'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting RFP by ID',
        expect.objectContaining({
          error: timeoutError,
        })
      );
    });
  });
});