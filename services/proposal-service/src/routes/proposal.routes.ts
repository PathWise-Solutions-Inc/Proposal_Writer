import { Router } from 'express';
import { proposalController } from '../controllers/proposal.controller';
import { requireRole, requireOrganizationAccess, userRateLimit } from '../middleware/auth.middleware';

const router = Router();

// Rate limiting for proposal operations
const proposalRateLimit = userRateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Proposal CRUD operations
router.post(
  '/',
  proposalRateLimit,
  requireOrganizationAccess(),
  proposalController.createProposal
);

router.get(
  '/',
  proposalController.getProposals
);

router.get(
  '/:id',
  proposalController.getProposal
);

router.put(
  '/:id',
  proposalRateLimit,
  proposalController.updateProposal
);

router.delete(
  '/:id',
  requireRole(['admin', 'owner']),
  proposalController.deleteProposal
);

// Proposal duplication
router.post(
  '/:id/duplicate',
  proposalRateLimit,
  proposalController.duplicateProposal
);

// Section management
router.post(
  '/:id/sections',
  proposalRateLimit,
  proposalController.addSection
);

router.put(
  '/:id/sections/:sectionId',
  proposalRateLimit,
  proposalController.updateSection
);

router.delete(
  '/:id/sections/:sectionId',
  proposalController.deleteSection
);

router.put(
  '/:id/sections/reorder',
  proposalRateLimit,
  proposalController.reorderSections
);

// Proposal statistics and analytics
router.get(
  '/:id/stats',
  proposalController.getProposalStats
);

export default router;