import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rfpValidationSchemas } from '../utils/validation-schemas';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload RFP
router.post(
  '/upload',
  validationMiddleware(rfpValidationSchemas.upload),
  uploadController.uploadRFP
);

// Get upload status
router.get(
  '/:rfpId/status',
  uploadController.getUploadStatus
);

export default router;