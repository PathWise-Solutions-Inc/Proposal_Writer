import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger, ProposalLogger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: string;
  userId?: string;
  email: string;
  role: string;
  organizationId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ProposalLogger.security('Missing or invalid authorization header', 'unknown', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Demo bypass for development and testing
    if (token === 'demo-access-token') {
      req.user = {
        id: 'demo-user-id',
        email: 'demo@example.com',
        role: 'user',
        organizationId: 'demo-org-id'
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Handle different JWT payload structures
      req.user = {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role,
        organizationId: decoded.organizationId
      };

      // Log successful authentication for audit trail
      logger.debug('User authenticated', {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId,
        url: req.originalUrl
      });

      next();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      ProposalLogger.security('Invalid JWT token', 'unknown', {
        error: errorMessage,
        token: token.substring(0, 20) + '...', // Log partial token for debugging
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', { 
      error,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service temporarily unavailable'
    });
  }
};

// Middleware to check if user has specific role
export const requireRole = (requiredRole: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(req.user.role)) {
      ProposalLogger.security('Insufficient role permissions', req.user.id, {
        requiredRole: roles,
        userRole: req.user.role,
        url: req.originalUrl
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check organization access
export const requireOrganizationAccess = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const proposalOrganizationId = req.body.organizationId || req.params.organizationId || req.query.organizationId;
    
    // If no organization context in request, allow through (will be checked at service level)
    if (!proposalOrganizationId) {
      return next();
    }

    // Check if user belongs to the organization
    if (req.user.organizationId !== proposalOrganizationId) {
      ProposalLogger.security('Organization access violation', req.user.id, {
        userOrganizationId: req.user.organizationId,
        requestedOrganizationId: proposalOrganizationId,
        url: req.originalUrl
      });
      
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to organization resources'
      });
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without user context
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId
    };
  } catch (error) {
    // Log the error but don't fail the request
    logger.debug('Optional auth failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.originalUrl
    });
  }

  next();
};

// Rate limiting per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      ProposalLogger.security('Rate limit exceeded', userId, {
        maxRequests,
        windowMs,
        url: req.originalUrl
      });
      
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }

    userRequests.count++;
    next();
  };
};