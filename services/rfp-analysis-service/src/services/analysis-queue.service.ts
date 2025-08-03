import Bull from 'bull';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export class AnalysisQueueService {
  private queue: Bull.Queue;

  constructor() {
    this.queue = new Bull('rfp-analysis', REDIS_URL, {
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.setupQueueHandlers();
  }

  async queueForAnalysis(rfpId: string): Promise<void> {
    try {
      await this.queue.add('analyze-rfp', { rfpId }, {
        priority: 1,
        delay: 1000 // Small delay to ensure text extraction completes
      });
      
      logger.info('RFP queued for analysis', { rfpId });
    } catch (error) {
      logger.error('Failed to queue RFP for analysis', { error, rfpId });
      throw error;
    }
  }

  private setupQueueHandlers() {
    this.queue.on('completed', (job) => {
      logger.info('Analysis job completed', { 
        jobId: job.id, 
        rfpId: job.data.rfpId 
      });
    });

    this.queue.on('failed', (job, err) => {
      logger.error('Analysis job failed', { 
        jobId: job.id, 
        rfpId: job.data.rfpId,
        error: err.message 
      });
    });
  }
}

export const analysisQueueService = new AnalysisQueueService();