import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();
const contentController = new ContentController();

// Validation rules
const generateContentValidation = [
  body('sectionTitle').notEmpty().withMessage('Section title is required'),
  body('sectionType').notEmpty().withMessage('Section type is required'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('variations').optional().isInt({ min: 1, max: 5 }).withMessage('Variations must be between 1 and 5'),
  body('tone').optional().isIn(['professional', 'conversational', 'technical', 'persuasive'])
    .withMessage('Invalid tone specified')
];

const checkComplianceValidation = [
  body('content').notEmpty().withMessage('Content is required'),
  body('requirements').isArray().withMessage('Requirements must be an array')
];

// Routes
router.post(
  '/generate',
  generateContentValidation,
  validateRequest,
  contentController.generateContent
);

router.post(
  '/generate-from-rfp',
  [
    body('rfpId').notEmpty().withMessage('RFP ID is required'),
    body('sectionId').notEmpty().withMessage('Section ID is required'),
    body('proposalId').notEmpty().withMessage('Proposal ID is required')
  ],
  validateRequest,
  contentController.generateFromRFP
);

router.post(
  '/refine',
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('improvements').isArray().withMessage('Improvements must be an array')
  ],
  validateRequest,
  contentController.refineContent
);

router.post(
  '/check-compliance',
  checkComplianceValidation,
  validateRequest,
  contentController.checkCompliance
);

export default router;