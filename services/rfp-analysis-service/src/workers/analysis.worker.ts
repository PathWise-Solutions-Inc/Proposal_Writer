import Bull from 'bull';
import { rfpAnalysisService } from '../services/rfp-analysis.service';
import { logger } from '../utils/logger';
import { initializeServices } from '../services/init.service';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create analysis queue
const analysisQueue = new Bull('rfp-analysis', REDIS_URL);

// Configure concurrency and processing
const CONCURRENCY = parseInt(process.env.ANALYSIS_CONCURRENCY || '2');
const MAX_ATTEMPTS = parseInt(process.env.MAX_ANALYSIS_ATTEMPTS || '3');

/**
 * Process RFP analysis jobs
 */
analysisQueue.process('analyze-rfp', CONCURRENCY, async (job) => {
  const { rfpId } = job.data;
  
  logger.info('Processing RFP analysis job', { 
    jobId: job.id, 
    rfpId,
    attempt: job.attemptsMade + 1 
  });

  try {
    // Perform the analysis
    await rfpAnalysisService.analyzeRfp(rfpId);
    
    logger.info('RFP analysis job completed', { 
      jobId: job.id, 
      rfpId 
    });
    
    return { 
      rfpId, 
      status: 'completed',
      completedAt: new Date() 
    };
  } catch (error) {
    logger.error('RFP analysis job failed', { 
      jobId: job.id, 
      rfpId, 
      error,
      attempt: job.attemptsMade + 1
    });
    
    // Re-throw to trigger retry
    throw error;
  }
});

// Queue event handlers
analysisQueue.on('completed', (job, result) => {
  logger.info('Analysis job completed', { 
    jobId: job.id, 
    result 
  });
});

analysisQueue.on('failed', (job, err) => {
  logger.error('Analysis job failed permanently', { 
    jobId: job.id, 
    rfpId: job.data.rfpId,
    error: err.message,
    attempts: job.attemptsMade 
  });
});

analysisQueue.on('stalled', (job) => {
  logger.warn('Analysis job stalled', { 
    jobId: job.id, 
    rfpId: job.data.rfpId 
  });
});

// Health check for the worker
export const getWorkerHealth = async () => {
  const [waiting, active, completed, failed] = await Promise.all([
    analysisQueue.getWaitingCount(),
    analysisQueue.getActiveCount(),
    analysisQueue.getCompletedCount(),
    analysisQueue.getFailedCount()
  ]);

  return {
    status: 'healthy',
    queue: {
      waiting,
      active,
      completed,
      failed
    },
    concurrency: CONCURRENCY,
    uptime: process.uptime()
  };
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down analysis worker...');
  
  // Stop accepting new jobs
  await analysisQueue.close();
  
  // Wait for active jobs to complete (max 30 seconds)
  const timeout = setTimeout(() => {
    logger.warn('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
  
  await analysisQueue.whenCurrentJobsFinished();
  clearTimeout(timeout);
  
  logger.info('Analysis worker shut down gracefully');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the worker
const startWorker = async () => {
  try {
    logger.info('Starting RFP analysis worker...');
    
    // Initialize services
    await initializeServices();
    
    logger.info(`Analysis worker started with concurrency: ${CONCURRENCY}`);
    logger.info(`Redis URL: ${REDIS_URL}`);
    
    // Log queue statistics every minute
    setInterval(async () => {
      const health = await getWorkerHealth();
      logger.info('Worker statistics', health);
    }, 60000);
    
  } catch (error) {
    logger.error('Failed to start analysis worker', { error });
    process.exit(1);
  }
};

// Start if run directly
if (require.main === module) {
  startWorker();
}

export { analysisQueue };