export const API_VERSION = 'v1';

export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  SUBMITTED: 'submitted',
  WON: 'won',
  LOST: 'lost',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export const RFP_STATUS = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  ANALYZED: 'analyzed',
  ERROR: 'error',
} as const;
