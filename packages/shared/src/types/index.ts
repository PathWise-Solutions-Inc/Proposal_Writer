export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  status: 'draft' | 'in_progress' | 'review' | 'submitted' | 'won' | 'lost';
  rfpId?: string;
  dueDate: Date;
  value?: number;
  winProbability?: number;
  createdBy: string;
  teamMembers: string[];
  sections: ProposalSection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  aiGenerated?: boolean;
  parentId?: string;
  children?: ProposalSection[];
}

export interface RFP {
  id: string;
  title: string;
  clientName: string;
  uploadedBy: string;
  fileName: string;
  fileSize: number;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  requirements: Requirement[];
  evaluationRubric?: EvaluationRubric;
  metadata: RFPMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requirement {
  id: string;
  text: string;
  type: 'mandatory' | 'optional' | 'informational';
  section: string;
  pageNumber?: number;
  addressed: boolean;
  proposalSectionId?: string;
}

export interface EvaluationRubric {
  id: string;
  categories: RubricCategory[];
  totalPoints: number;
  confidenceScore: number;
}

export interface RubricCategory {
  id: string;
  name: string;
  description?: string;
  weight: number;
  maxPoints: number;
  subcategories?: RubricCategory[];
}

export interface RFPMetadata {
  pageCount: number;
  wordCount: number;
  submissionDeadline?: Date;
  estimatedValue?: number;
  industry?: string;
  keywords: string[];
}

export interface ClientResearch {
  id: string;
  clientName: string;
  website?: string;
  industry: string;
  companySize?: string;
  revenue?: string;
  recentNews: NewsItem[];
  keyInitiatives: string[];
  painPoints: string[];
  competitors: string[];
  lastUpdated: Date;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  date: Date;
  url?: string;
}
