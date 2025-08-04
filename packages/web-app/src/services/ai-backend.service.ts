import axios, { AxiosInstance } from 'axios';
import { getAuthToken } from '../utils/auth';

// Types for AI backend service
export interface AIGenerationOptions {
  tone: 'professional' | 'technical' | 'persuasive' | 'conversational';
  context: {
    proposalTitle: string;
    sectionTitle: string;
    sectionType: string;
    previousContent?: any;
    rfpRequirements?: string;
  };
  prompt?: string;
}

export interface GeneratedContent {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    tone: string;
    qualityScore: number;
  };
}

export interface ContentGenerationRequest {
  sectionTitle: string;
  sectionType: string;
  requirements?: string[];
  context?: {
    companyInfo?: string;
    pastProposals?: string;
    clientResearch?: string;
  };
  tone?: 'professional' | 'conversational' | 'technical' | 'persuasive';
  maxLength?: number;
  variations?: number;
}

class AIBackendService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8003'}/api`,
      timeout: 30000,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Generate content for a section
   */
  async generateContent(
    sectionType: string,
    options: AIGenerationOptions
  ): Promise<GeneratedContent> {
    try {
      const response = await this.api.post('/content/generate', {
        sectionTitle: options.context.sectionTitle,
        sectionType: sectionType,
        requirements: options.prompt ? [options.prompt] : [],
        context: {
          companyInfo: options.context.proposalTitle,
          rfpRequirements: options.context.rfpRequirements,
        },
        tone: options.tone,
        variations: 1,
      });

      const variation = response.data.data.variations[0];
      
      return {
        content: variation.content,
        metadata: {
          wordCount: variation.wordCount,
          readingTime: Math.ceil(variation.wordCount / 200), // ~200 words per minute
          tone: variation.tone,
          qualityScore: 85, // Default quality score
        },
      };
    } catch (error) {
      console.error('Failed to generate content:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  /**
   * Generate multiple variations of content
   */
  async generateVariations(
    sectionType: string,
    options: AIGenerationOptions,
    count: number = 3
  ): Promise<GeneratedContent[]> {
    try {
      const response = await this.api.post('/content/generate', {
        sectionTitle: options.context.sectionTitle,
        sectionType: sectionType,
        requirements: options.prompt ? [options.prompt] : [],
        context: {
          companyInfo: options.context.proposalTitle,
          rfpRequirements: options.context.rfpRequirements,
        },
        tone: options.tone,
        variations: count,
      });

      return response.data.data.variations.map((variation: any) => ({
        content: variation.content,
        metadata: {
          wordCount: variation.wordCount,
          readingTime: Math.ceil(variation.wordCount / 200),
          tone: variation.tone,
          qualityScore: 85,
        },
      }));
    } catch (error) {
      console.error('Failed to generate variations:', error);
      throw new Error('Failed to generate content variations. Please try again.');
    }
  }

  /**
   * Improve existing content
   */
  async improveContent(
    content: any,
    options: { tone: string; focusAreas: string[] }
  ): Promise<GeneratedContent> {
    try {
      const contentText = typeof content === 'string' ? content : content.text || '';
      
      const response = await this.api.post('/content/refine', {
        content: contentText,
        improvements: options.focusAreas,
        tone: options.tone,
      });

      // Since refine endpoint isn't fully implemented yet, simulate response
      return {
        content: response.data.data.refinedContent || contentText,
        metadata: {
          wordCount: contentText.split(/\s+/).length,
          readingTime: Math.ceil(contentText.split(/\s+/).length / 200),
          tone: options.tone,
          qualityScore: 90,
        },
      };
    } catch (error) {
      console.error('Failed to improve content:', error);
      throw new Error('Failed to improve content. Please try again.');
    }
  }

  /**
   * Check content compliance
   */
  async checkCompliance(
    content: string,
    requirements: Array<{ text: string; type: string }>
  ) {
    try {
      const response = await this.api.post('/content/check-compliance', {
        content,
        requirements,
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to check compliance:', error);
      throw new Error('Failed to check compliance. Please try again.');
    }
  }
}

// Export singleton instance
export const aiBackendService = new AIBackendService();