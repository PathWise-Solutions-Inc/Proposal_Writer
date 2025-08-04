import winston from 'winston';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const logDir = process.env.LOG_DIR || 'logs';

// Custom format for proposal service logs
const proposalServiceFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service = 'proposal-service', ...meta }) => {
    const logEntry = {
      timestamp,
      level,
      service,
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  })
);

// Create winston logger
export const logger = winston.createLogger({
  level: logLevel,
  format: proposalServiceFormat,
  defaultMeta: { service: 'proposal-service' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, proposalId, userId, ...meta }) => {
          let logString = `${level}: ${message}`;
          
          // Add contextual information for proposal operations
          if (proposalId) {
            logString += ` [proposalId=${proposalId}]`;
          }
          if (userId) {
            logString += ` [userId=${userId}]`;
          }
          
          // Add additional metadata if present
          if (Object.keys(meta).length > 0) {
            logString += ` ${JSON.stringify(meta)}`;
          }
          
          return logString;
        })
      )
    }),

    // File transport for production
    new winston.transports.File({
      filename: path.join(logDir, 'proposal-service-error.log'),
      level: 'error',
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'proposal-service-combined.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true
    })
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'proposal-service-exceptions.log'),
      maxsize: 50 * 1024 * 1024,
      maxFiles: 3
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'proposal-service-rejections.log'),
      maxsize: 50 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Proposal-specific logging utilities
export class ProposalLogger {
  static proposalOperation(
    operation: string,
    proposalId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    logger.info(`Proposal ${operation}`, {
      operation,
      proposalId,
      userId,
      ...metadata
    });
  }

  static sectionOperation(
    operation: string,
    proposalId: string,
    sectionId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    logger.info(`Section ${operation}`, {
      operation,
      proposalId,
      sectionId,
      userId,
      ...metadata
    });
  }

  static collaborationEvent(
    event: string,
    proposalId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    logger.info(`Collaboration: ${event}`, {
      event,
      proposalId,
      userId,
      ...metadata
    });
  }

  static aiOperation(
    operation: string,
    proposalId: string,
    sectionId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    logger.info(`AI ${operation}`, {
      operation,
      proposalId,
      sectionId,
      userId,
      aiOperation: true,
      ...metadata
    });
  }

  static versionOperation(
    operation: string,
    proposalId: string,
    versionId: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    logger.info(`Version ${operation}`, {
      operation,
      proposalId,
      versionId,
      userId,
      ...metadata
    });
  }

  static performanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: Record<string, any>
  ) {
    logger.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      performance: true,
      ...context
    });
  }

  static error(
    error: Error,
    operation: string,
    context?: Record<string, any>
  ) {
    logger.error(`Error in ${operation}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      operation,
      ...context
    });
  }

  static security(
    event: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    logger.warn(`Security: ${event}`, {
      event,
      userId,
      security: true,
      ...metadata
    });
  }
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    logger.http('HTTP Request', {
      method,
      url: originalUrl,
      statusCode,
      duration,
      ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      proposalId: req.params?.proposalId || req.params?.id
    });
  });
  
  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: any, _res: any, next: any) => {
  ProposalLogger.error(error, 'HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    proposalId: req.params?.proposalId || req.params?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(error);
};

export default logger;