import { logger } from '../utils/logger';

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  
  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Frontend
  FRONTEND_URL: string;
}

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME', 
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const defaultValues: Partial<EnvironmentConfig> = {
  NODE_ENV: 'development',
  PORT: 8001,
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  FRONTEND_URL: 'http://localhost:3000',
};

export const validateEnvironment = (): void => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // Validate JWT secrets are strong enough
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
  
  // Warn about production configuration
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different in production');
    }
    
    if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost')) {
      logger.warn('FRONTEND_URL contains localhost in production environment');
    }
  }
  
  logger.info('Environment validation passed');
};

export const getEnvConfig = (): EnvironmentConfig => {
  return {
    NODE_ENV: process.env.NODE_ENV || defaultValues.NODE_ENV!,
    PORT: parseInt(process.env.PORT || String(defaultValues.PORT)),
    
    // Database
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: parseInt(process.env.DB_PORT!),
    DB_NAME: process.env.DB_NAME!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || defaultValues.JWT_EXPIRES_IN!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || defaultValues.JWT_REFRESH_EXPIRES_IN!,
    
    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || defaultValues.FRONTEND_URL!,
  };
};