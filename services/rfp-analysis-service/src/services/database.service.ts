import { AppDataSource } from '../config/database';
import { RFP } from '../../../auth-service/src/models/RFP';
import { logger } from '../utils/logger';

export class DatabaseService {
  async findRfpByHash(fileHash: string, organizationId: string): Promise<RFP | null> {
    try {
      const repository = AppDataSource.getRepository(RFP);
      // Use query builder for JSONB field queries
      const rfp = await repository
        .createQueryBuilder('rfp')
        .where("rfp.metadata->>'fileHash' = :fileHash", { fileHash })
        .andWhere('rfp.organizationId = :organizationId', { organizationId })
        .getOne();
      
      return rfp;
    } catch (error) {
      logger.error('Error finding RFP by hash', { error, fileHash, organizationId });
      throw error;
    }
  }

  async createRfp(data: Partial<RFP>): Promise<RFP> {
    try {
      const repository = AppDataSource.getRepository(RFP);
      const rfp = repository.create(data);
      const savedRfp = await repository.save(rfp);
      // TypeORM save() returns the saved entity, not an array
      return Array.isArray(savedRfp) ? savedRfp[0] : savedRfp;
    } catch (error) {
      logger.error('Error creating RFP', { error, data });
      throw error;
    }
  }

  async updateRfpStatus(rfpId: string, status: 'uploaded' | 'processing' | 'analyzed' | 'error', additionalData?: any): Promise<void> {
    try {
      const repository = AppDataSource.getRepository(RFP);
      await repository.update(
        { id: rfpId },
        {
          status,
          ...(additionalData && { metadata: additionalData })
        }
      );
    } catch (error) {
      logger.error('Error updating RFP status', { error, rfpId, status });
      throw error;
    }
  }

  async getRfpById(rfpId: string): Promise<RFP | null> {
    try {
      const repository = AppDataSource.getRepository(RFP);
      return await repository.findOne({
        where: { id: rfpId }
      });
    } catch (error) {
      logger.error('Error getting RFP by ID', { error, rfpId });
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();