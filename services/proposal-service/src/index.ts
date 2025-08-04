import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { initializeDatabase, closeDatabase } from './config/database';
import { initializeRedis, closeRedis, CacheService } from './config/redis';
import { logger, requestLogger, errorLogger } from './utils/logger';
import { CollaborationGateway } from './websocket/collaboration.gateway';

// Import routes
import proposalRoutes from './routes/proposal.routes';
import collaborationRoutes from './routes/collaboration.routes';
import contentRoutes from './routes/content.routes';

// Import middleware
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandlerMiddleware } from './middleware/error.middleware';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 8003;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'proposal-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes with authentication
app.use('/api/proposals', authMiddleware, proposalRoutes);
app.use('/api/collaboration', authMiddleware, collaborationRoutes);
app.use('/api/content', authMiddleware, contentRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    service: 'proposal-service'
  });
});

// Error handling middleware
app.use(errorLogger);
app.use(errorHandlerMiddleware);

// Initialize services
async function initializeServices() {
  try {
    logger.info('🚀 Starting Proposal Service...');

    // Skip database initialization in development if not configured
    if (process.env.DB_HOST && process.env.DB_USERNAME && process.env.DB_PASSWORD) {
      await initializeDatabase();
      logger.info('✅ Database initialized');
    } else {
      logger.info('⚠️ Database initialization skipped (no DB config found)');
    }

    // Initialize Redis - skip if not available
    let redis;
    let collaborationGateway;
    
    try {
      redis = await initializeRedis();
      CacheService.getInstance(redis);
      logger.info('✅ Redis initialized');

      // Initialize WebSocket collaboration gateway
      collaborationGateway = new CollaborationGateway(io, redis);
      collaborationGateway.initialize();
      logger.info('✅ WebSocket collaboration gateway initialized');
    } catch (redisError) {
      logger.warn('⚠️ Redis initialization failed, continuing without cache:', redisError);
    }

    return { redis, collaborationGateway };
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    const services = await initializeServices();

    server.listen(PORT, () => {
      logger.info(`🚀 Proposal Service running on http://localhost:${PORT}`);
      logger.info(`📊 Environment: ${NODE_ENV}`);
      logger.info(`🔌 WebSocket server ready for collaboration`);
      
      console.log(`
╔══════════════════════════════════════╗
║       Proposal Service Started       ║
║                                      ║
║  🌐 HTTP Server: http://localhost:${PORT.toString().padEnd(4)} ║
║  🔌 WebSocket: ws://localhost:${PORT.toString().padEnd(5)}  ║
║  🗄️  Database: Connected             ║
║  🔴 Redis: Connected                 ║
║  📝 Logs: ./logs/                    ║
╚══════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`📥 Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('🛑 HTTP server closed');

        try {
          // Close WebSocket server
          services.collaborationGateway.close();
          logger.info('🔌 WebSocket server closed');

          // Close database connection
          await closeDatabase();
          logger.info('🗄️  Database connection closed');

          // Close Redis connection
          await closeRedis();
          logger.info('🔴 Redis connection closed');

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after timeout
      setTimeout(() => {
        logger.error('⏰ Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export { app, server, io };
export default app;