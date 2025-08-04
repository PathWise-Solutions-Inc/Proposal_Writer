import { Request, Response, NextFunction } from 'express';
import { logger, ProposalLogger } from '../utils/logger';

export class ProposalServiceError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ProposalServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes for different scenarios
export class ValidationError extends ProposalServiceError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ProposalServiceError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ProposalServiceError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ProposalServiceError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ProposalServiceError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ProposalServiceError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends ProposalServiceError {
  constructor(service: string, message: string) {
    super(`External service error (${service}): ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

export class CollaborationError extends ProposalServiceError {
  constructor(message: string) {
    super(message, 409, 'COLLABORATION_ERROR');
    this.name = 'CollaborationError';
  }
}

export class ContentGenerationError extends ProposalServiceError {
  constructor(message: string) {
    super(message, 500, 'CONTENT_GENERATION_ERROR');
    this.name = 'ContentGenerationError';
  }
}

// Error handler middleware
export const errorHandlerMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle known operational errors
  if (error instanceof ProposalServiceError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  }
  // Handle validation errors from express-validator
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  }
  // Handle database errors
  else if (error.name === 'QueryFailedError') {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
    
    // Handle specific database constraint violations
    if (error.message.includes('duplicate key')) {
      code = 'DUPLICATE_ENTRY';
      message = 'Resource already exists';
    } else if (error.message.includes('foreign key constraint')) {
      code = 'INVALID_REFERENCE';
      message = 'Referenced resource does not exist';
    }
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle multer file upload errors
  else if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = error.message;
  }
  // Handle Redis connection errors
  else if (error.message?.includes('Redis')) {
    statusCode = 503;
    code = 'CACHE_SERVICE_ERROR';
    message = 'Cache service temporarily unavailable';
  }

  // Log the error with appropriate level
  const logContext = {
    userId: req.user?.id,
    proposalId: req.params?.proposalId || req.params?.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params
  };

  if (statusCode >= 500) {
    ProposalLogger.error(error, 'HTTP Request Error', logContext);
  } else if (statusCode >= 400) {
    logger.warn(`Client error: ${message}`, {
      code,
      statusCode,
      ...logContext
    });
  }

  // Prepare error response
  const errorResponse: any = {
    error: {
      code,
      message,
      statusCode
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = error.stack;
    errorResponse.error.details = details;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to catch promise rejections
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new NotFoundError('Route', req.originalUrl);
  
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  res.status(404).json({
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// Global error handlers for uncaught exceptions
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    
    // Perform graceful shutdown
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Convert to an error and let the process crash
    throw new Error(`Unhandled promise rejection: ${reason}`);
  });
};

// Helper function to create API response format
export const createSuccessResponse = (
  data: any,
  message?: string,
  meta?: any
) => {
  return {
    success: true,
    message: message || 'Operation completed successfully',
    data,
    meta,
    timestamp: new Date().toISOString()
  };
};

// Helper function to validate required fields
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
) => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
};

// Helper function to check proposal access permissions
export const checkProposalAccess = async (
  proposalId: string,
  userId: string,
  requiredRole: 'owner' | 'editor' | 'reviewer' | 'viewer' = 'viewer'
) => {
  // This would typically check database for user's access to the proposal
  // For now, we'll implement a basic check
  
  // In a real implementation, you would:
  // 1. Query the proposal from database
  // 2. Check if user is owner or in collaborators list
  // 3. Verify user has required role level
  
  // Placeholder implementation
  return true;
};