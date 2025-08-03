import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rfpRoutes from './routes/rfp.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { initializeServices } from './services/init.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'rfp-analysis-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/rfp', rfpRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize services (database, queues, etc.)
    await initializeServices();

    app.listen(PORT, () => {
      logger.info(`RFP Analysis Service running on port ${PORT}`);
      console.log(`🚀 RFP Analysis Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});