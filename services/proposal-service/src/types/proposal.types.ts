export interface Section {
  id: string;
  title: string;
  content: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'custom';
  order: number;
  parentId?: string;
  children: string[];
  metadata: {
    wordCount: number;
    lastEditedBy: string;
    lastEditedAt: Date;
    aiGenerated: boolean;
    template?: string;
  };
  requirements?: string[];
  placeholder?: string;
  isRequired?: boolean;
}

export interface ProposalDocument {
  id: string;
  title: string;
  rfpId: string;
  organizationId: string;
  ownerId: string;
  status: 'draft' | 'in_review' | 'finalized' | 'submitted' | 'won' | 'lost';
  sections: Record<string, Section>;
  sectionOrder: string[];
  metadata: {
    clientInfo?: {
      name: string;
      industry?: string;
      size?: string;
      painPoints?: string[];
    };
    winThemes?: string[];
    discriminators?: string[];
    pricing?: {
      total?: number;
      currency?: string;
      breakdown?: any;
    };
    lastSaved?: Date;
    wordCount?: number;
    estimatedReadTime?: number;
  };
  collaborators: CollaboratorInfo[];
  versions: VersionInfo[];
  complianceTracking?: {
    requirements: RequirementTracking[];
    overallScore: number;
    lastChecked: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaboratorInfo {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  addedAt: Date;
  lastActive?: Date;
  isOnline?: boolean;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  sectionId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
}

export interface VersionInfo {
  id: string;
  versionNumber: number;
  createdAt: Date;
  createdBy: string;
  changes: string;
  snapshot?: ProposalDocument;
  size: number;
}

export interface RequirementTracking {
  requirementId: string;
  title: string;
  description: string;
  addressed: boolean;
  sectionIds: string[];
  confidence: number;
  notes?: string;
}

export interface Comment {
  id: string;
  proposalId: string;
  sectionId: string;
  userId: string;
  content: string;
  position?: {
    startOffset: number;
    endOffset: number;
    lineNumber?: number;
  };
  resolved: boolean;
  replies: CommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  placeholder: string;
  type: Section['type'];
  isRequired: boolean;
  order: number;
  metadata: {
    industry?: string;
    proposalType?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
  };
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: {
    sections: Array<{
      templateId: string;
      title: string;
      description: string;
      required: boolean;
      order: number;
    }>;
  };
  metadata: {
    industry?: string;
    proposalType?: string;
    estimatedTime?: number;
    successRate?: number;
  };
  organizationId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentGenerationRequest {
  sectionId: string;
  proposalId: string;
  prompt: string;
  context: {
    rfpRequirements?: string[];
    companyInfo?: any;
    previousContent?: Record<string, Section>;
    winThemes?: string[];
  };
  options: {
    tone: 'professional' | 'persuasive' | 'technical' | 'friendly';
    length: 'brief' | 'detailed' | 'comprehensive';
    variations: number;
    includeExamples?: boolean;
    targetAudience?: string;
  };
}

export interface ContentGenerationResponse {
  sectionId: string;
  content: string;
  variations: string[];
  confidence: number;
  suggestions: string[];
  metadata: {
    model: string;
    generatedAt: Date;
    processingTime: number;
    tokenCount: number;
  };
}

export interface CollaborationMessage {
  type: 'USER_JOINED' | 'USER_LEFT' | 'CURSOR_MOVED' | 'CONTENT_CHANGED' | 
        'SECTION_ADDED' | 'SECTION_DELETED' | 'SECTION_REORDERED' | 
        'COMMENT_ADDED' | 'COMMENT_UPDATED' | 'COMMENT_RESOLVED' |
        'PROPOSAL_SAVED' | 'VERSION_CREATED';
  proposalId: string;
  userId: string;
  timestamp: number;
  data: any;
}

export interface ContentChange {
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  timestamp: number;
  sectionId: string;
}

export interface ProposalDiff {
  fromVersion: number;
  toVersion: number;
  changes: {
    sectionId: string;
    type: 'added' | 'removed' | 'modified';
    oldContent?: string;
    newContent?: string;
    textDiff?: Array<{
      type: 'equal' | 'insert' | 'delete';
      text: string;
    }>;
  }[];
  summary: {
    sectionsAdded: number;
    sectionsRemoved: number;
    sectionsModified: number;
    totalChanges: number;
  };
}

export interface CreateProposalRequest {
  title: string;
  rfpId: string;
  templateId?: string;
  initialStructure?: Partial<ProposalDocument>;
}

export interface UpdateProposalRequest {
  title?: string;
  status?: ProposalDocument['status'];
  metadata?: Partial<ProposalDocument['metadata']>;
}

export interface AddSectionRequest {
  title: string;
  type: Section['type'];
  parentId?: string;
  index?: number;
  templateId?: string;
  content?: string;
}

export interface UpdateSectionRequest {
  title?: string;
  content?: string;
  type?: Section['type'];
  requirements?: string[];
  metadata?: Partial<Section['metadata']>;
}

export interface ReorderSectionsRequest {
  sectionOrders: Array<{
    sectionId: string;
    newIndex: number;
    newParentId?: string;
  }>;
}

export interface AddCollaboratorRequest {
  email: string;
  role: CollaboratorInfo['role'];
  message?: string;
}

export interface UpdateCollaboratorRequest {
  role: CollaboratorInfo['role'];
}

export interface CreateCommentRequest {
  sectionId: string;
  content: string;
  position?: Comment['position'];
}

export interface UpdateCommentRequest {
  content: string;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown';
  includeComments?: boolean;
  includeVersionHistory?: boolean;
  customStyling?: any;
  watermark?: string;
}

export interface ProposalMetrics {
  proposalId: string;
  metrics: {
    timeSpent: number;
    collaboratorCount: number;
    versionCount: number;
    commentCount: number;
    wordCount: number;
    sectionsCount: number;
    aiGeneratedSections: number;
    complianceScore: number;
    lastActivity: Date;
  };
  performance: {
    avgResponseTime: number;
    saveFrequency: number;
    errorRate: number;
  };
}