import { Router, Request, Response } from 'express';
import { asyncHandler, createSuccessResponse } from '../middleware/error.middleware';

const router = Router();

// Get collaborators for a proposal
router.get('/:proposalId/collaborators', asyncHandler(async (req: Request, res: Response) => {
  const { proposalId } = req.params;
  
  // Mock collaborators
  const collaborators = [
    {
      userId: req.user!.id,
      email: req.user!.email,
      name: req.user!.email,
      role: 'owner',
      addedAt: new Date(),
      isOnline: true
    }
  ];

  res.json(createSuccessResponse(collaborators, 'Collaborators retrieved successfully'));
}));

// Add collaborator to proposal
router.post('/:proposalId/collaborators', asyncHandler(async (req: Request, res: Response) => {
  const { proposalId } = req.params;
  const { email, role } = req.body;

  // TODO: Implement add collaborator logic
  
  res.status(201).json(createSuccessResponse(
    { email, role, addedAt: new Date() },
    'Collaborator added successfully'
  ));
}));

// Update collaborator role
router.put('/:proposalId/collaborators/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  // TODO: Implement update collaborator logic
  
  res.json(createSuccessResponse(
    { userId, role, updatedAt: new Date() },
    'Collaborator role updated successfully'
  ));
}));

// Remove collaborator
router.delete('/:proposalId/collaborators/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  // TODO: Implement remove collaborator logic
  
  res.json(createSuccessResponse(null, 'Collaborator removed successfully'));
}));

// Get comments for proposal
router.get('/:proposalId/comments', asyncHandler(async (req: Request, res: Response) => {
  // Mock comments
  const comments: any[] = [];

  res.json(createSuccessResponse(comments, 'Comments retrieved successfully'));
}));

// Add comment
router.post('/:proposalId/comments', asyncHandler(async (req: Request, res: Response) => {
  const { proposalId } = req.params;
  const { sectionId, content, position } = req.body;

  const comment = {
    id: 'comment-' + Date.now(),
    proposalId,
    sectionId,
    userId: req.user!.id,
    content,
    position,
    resolved: false,
    replies: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  res.status(201).json(createSuccessResponse(comment, 'Comment added successfully'));
}));

// Update comment
router.put('/:proposalId/comments/:commentId', asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;

  res.json(createSuccessResponse(
    { id: commentId, content, updatedAt: new Date() },
    'Comment updated successfully'
  ));
}));

// Resolve comment
router.patch('/:proposalId/comments/:commentId/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  res.json(createSuccessResponse(
    { id: commentId, resolved: true, resolvedAt: new Date() },
    'Comment resolved successfully'
  ));
}));

// Delete comment
router.delete('/:proposalId/comments/:commentId', asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  res.json(createSuccessResponse(null, 'Comment deleted successfully'));
}));

export default router;