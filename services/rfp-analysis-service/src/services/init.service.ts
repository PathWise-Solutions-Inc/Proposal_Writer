import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

export const initializeServices = async () => {
  try {
    // Initialize database
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // TODO: Initialize other services as needed
    // - Redis connection
    // - Apache Tika
    // - etc.

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed', { error });
    throw error;
  }
};