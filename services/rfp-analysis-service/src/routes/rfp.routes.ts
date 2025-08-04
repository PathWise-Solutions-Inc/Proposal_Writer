import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { analysisController } from '../controllers/analysis.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rfpValidationSchemas } from '../utils/validation-schemas';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload RFP
router.post(
  '/upload',
  uploadController.uploadRFP
);

// Get upload status
router.get(
  '/:rfpId/status',
  uploadController.getUploadStatus
);

// Trigger manual analysis
router.post(
  '/:rfpId/analyze',
  analysisController.triggerAnalysis
);

// Get analysis results
router.get(
  '/:rfpId/analysis',
  analysisController.getAnalysisResults
);

// Get evaluation rubric
router.get(
  '/:rfpId/rubric',
  analysisController.getEvaluationRubric
);

// Get queue statistics
router.get(
  '/queue/stats',
  analysisController.getQueueStats
);

export default router;