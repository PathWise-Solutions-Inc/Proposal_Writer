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

  async queueForAnalysis(rfpId: string, priority: number = 1): Promise<Bull.Job> {
    try {
      const job = await this.queue.add('analyze-rfp', { rfpId }, {
        priority,
        delay: 1000 // Small delay to ensure text extraction completes
      });
      
      logger.info('RFP queued for analysis', { 
        rfpId, 
        jobId: job.id,
        priority 
      });
      
      return job;
    } catch (error) {
      logger.error('Failed to queue RFP for analysis', { error, rfpId });
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<{
    state: string;
    progress: number;
    result?: any;
    failedReason?: string;
  }> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const state = await job.getState();
    const progress = job.progress();
    
    return {
      state,
      progress: typeof progress === 'number' ? progress : 0,
      result: job.returnvalue,
      failedReason: job.failedReason
    };
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount()
    ]);

    return { waiting, active, completed, failed, delayed };
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

    this.queue.on('progress', (job, progress) => {
      logger.debug('Analysis job progress', { 
        jobId: job.id, 
        rfpId: job.data.rfpId,
        progress 
      });
    });
  }
}

export const analysisQueueService = new AnalysisQueueService();