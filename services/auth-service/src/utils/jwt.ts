const jwt = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: any): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: JWT_ALGORITHM,
  });
};

export const generateRefreshToken = (user: any): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }

  const payload = {
    userId: user.id,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    algorithm: JWT_ALGORITHM,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM]
  }) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  return jwt.verify(token, secret, {
    algorithms: [JWT_ALGORITHM]
  }) as { userId: string };
};