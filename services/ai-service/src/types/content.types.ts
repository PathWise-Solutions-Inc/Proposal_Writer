export interface ContentGenerationRequest {
  sectionTitle: string;
  sectionType: string;
  requirements?: string[];
  context?: {
    companyInfo?: string;
    pastProposals?: string;
    clientResearch?: string;
    rfpRequirements?: Array<{
      text: string;
      type: 'mandatory' | 'optional' | 'informational';
    }>;
  };
  tone?: 'professional' | 'conversational' | 'technical' | 'persuasive';
  maxLength?: number;
  variations?: number;
}

export interface ContentGenerationResponse {
  success: boolean;
  data?: {
    sectionTitle: string;
    sectionType: string;
    variations: ContentVariation[];
    generatedAt: string;
  };
  error?: string;
  message?: string;
}

export interface ContentVariation {
  id: string;
  content: string;
  tone: string;
  wordCount: number;
}

export interface ContentRefinementRequest {
  content: string;
  improvements: string[];
  tone?: string;
}

export interface ComplianceCheckRequest {
  content: string;
  requirements: Array<{
    text: string;
    type: string;
  }>;
}

export interface ComplianceCheckResponse {
  overallScore: number;
  missingRequirements: string[];
  suggestions: string[];
}