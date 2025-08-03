import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Store CSRF tokens in memory (use Redis in production)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    // Generate new token for GET requests
    const token = generateCsrfToken();
    const sessionId = req.cookies.sessionId || crypto.randomBytes(16).toString('hex');
    
    csrfTokens.set(sessionId, {
      token,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // Set session cookie if not exists
    if (!req.cookies.sessionId) {
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }
    
    // Add CSRF token getter to request
    (req as any).csrfToken = () => token;
    
    // Set CSRF token in response header for client to read
    res.setHeader('X-CSRF-Token', token);
    
    return next();
  }
  
  // Verify CSRF token for state-changing requests
  const sessionId = req.cookies.sessionId;
  const providedToken = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!sessionId || !providedToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  
  const storedData = csrfTokens.get(sessionId);
  
  if (!storedData || storedData.expires < Date.now()) {
    return res.status(403).json({ error: 'CSRF token expired' });
  }
  
  if (storedData.token !== providedToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Token is valid, proceed
  next();
};

// Middleware to get CSRF token
export const getCsrfToken = (req: Request, res: Response) => {
  const token = generateCsrfToken();
  const sessionId = req.cookies.sessionId || crypto.randomBytes(16).toString('hex');
  
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  
  if (!req.cookies.sessionId) {
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
  
  res.json({ csrfToken: token });
};