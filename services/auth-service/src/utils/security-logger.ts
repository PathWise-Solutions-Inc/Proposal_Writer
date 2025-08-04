import { logger } from './logger';

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILURE'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_LOCKED'
  | 'INVALID_TOKEN'
  | 'CSRF_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  details?: any;
  timestamp: Date;
}

export class SecurityLogger {
  static log(event: Omit<SecurityEvent, 'timestamp'>) {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Log with appropriate level based on event type
    const level = this.getLogLevel(event.type);
    
    logger[level]({
      message: `Security Event: ${event.type}`,
      ...fullEvent,
      service: 'auth-service',
    });

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(fullEvent);
    }
  }

  private static getLogLevel(eventType: SecurityEventType): 'info' | 'warn' | 'error' {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
      case 'LOGOUT':
      case 'REGISTER_SUCCESS':
        return 'info';
      
      case 'LOGIN_FAILURE':
      case 'REGISTER_FAILURE':
      case 'INVALID_TOKEN':
        return 'warn';
      
      case 'ACCOUNT_LOCKED':
      case 'CSRF_VIOLATION':
      case 'RATE_LIMIT_EXCEEDED':
      case 'PASSWORD_CHANGE':
        return 'error';
      
      default:
        return 'warn';
    }
  }

  private static sendToMonitoring(_event: SecurityEvent) {
    // TODO: Integrate with security monitoring service
    // Examples: Splunk, ELK Stack, Datadog, etc.
  }
}

// Helper function for Express middleware
export function getClientInfo(req: any) {
  return {
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
  };
}