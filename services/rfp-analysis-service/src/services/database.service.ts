import { AppDataSource } from '../config/database';
import { RFP } from '../../../auth-service/src/models/RFP';
import { logger } from '../utils/logger';

export class DatabaseService {
  async findRfpByHash(fileHash: string, organizationId: string): Promise<RFP | null> {
    try {
      const repository = AppDataSource.getRepository(RFP);
      return await repository.findOne({
        where: {
          'metadata.fileHash': fileHash,
          organizationId
        }
      });
    } catch (error) {
      logger.error('Error finding RFP by hash', { error, fileHash, organizationId });
      throw error;
    }
  }

  async createRfp(data: any): Promise<RFP> {
    try {
      const repository = AppDataSource.getRepository(RFP);
      const rfp = repository.create(data);
      return await repository.save(rfp);
    } catch (error) {
      logger.error('Error creating RFP', { error, data });
      throw error;
    }
  }

  async updateRfpStatus(rfpId: string, status: string, additionalData?: any): Promise<void> {
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