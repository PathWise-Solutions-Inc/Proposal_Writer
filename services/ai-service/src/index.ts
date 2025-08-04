import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { OpenRouterService } from './services/openrouter.service';

const app = express();
const PORT = config.port || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

// Test endpoint
app.post('/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    const openRouterService = new OpenRouterService();
    const result = await openRouterService.generateContent({
      messages: [{ role: 'user' as const, content: prompt }],
      model
    });
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Error generating content:', error);
    res.status(500).json({ success: false, error: 'Failed to generate content' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 AI Service running on http://localhost:${PORT}`);
});