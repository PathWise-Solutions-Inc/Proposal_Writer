import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class OpenRouterService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Proposal Writer',
      },
    });
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  }

  /**
   * Analyze RFP content and extract requirements
   */
  async analyzeRFP(content: string): Promise<{
    requirements: Array<{
      text: string;
      type: 'mandatory' | 'optional' | 'informational';
      section: string;
    }>;
    summary: string;
    keywords: string[];
  }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert RFP analyst. Extract and categorize all requirements from the RFP.
            
            For each requirement, determine if it's:
            - mandatory (must/shall/required)
            - optional (should/may/preferred)
            - informational (background/context)
            
            Return a JSON object with:
            {
              "requirements": [{"text": "...", "type": "...", "section": "..."}],
              "summary": "Brief RFP summary",
              "keywords": ["key", "terms"]
            }`,
          },
          {
            role: 'user',
            content: `Analyze this RFP content:\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      return JSON.parse(result || '{}');
    } catch (error) {
      logger.error('RFP analysis error:', error);
      throw new Error('Failed to analyze RFP');
    }
  }

  /**
   * Generate evaluation rubric from RFP
   */
  async generateRubric(rfpContent: string, requirements: any[]): Promise<{
    categories: Array<{
      name: string;
      description: string;
      weight: number;
      maxPoints: number;
      criteria: string[];
    }>;
    totalPoints: number;
    confidenceScore: number;
  }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating RFP evaluation rubrics. 
            Based on the RFP content and requirements, generate a scoring rubric that evaluators would likely use.
            
            Consider typical evaluation categories like:
            - Technical approach and understanding
            - Past performance and experience
            - Management approach
            - Price/cost
            - Innovation
            
            Return a JSON object with evaluation categories, weights, and scoring criteria.`,
          },
          {
            role: 'user',
            content: `Create an evaluation rubric for this RFP:\n\n${rfpContent}\n\nRequirements:\n${JSON.stringify(requirements)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      return JSON.parse(result || '{}');
    } catch (error) {
      logger.error('Rubric generation error:', error);
      throw new Error('Failed to generate evaluation rubric');
    }
  }

  /**
   * Generate proposal content for a section
   */
  async generateContent(
    sectionTitle: string,
    requirements: string[],
    context: {
      companyInfo?: string;
      pastProposals?: string;
      clientResearch?: string;
    }
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert proposal writer. Generate compelling, professional proposal content that:
            - Directly addresses all requirements
            - Demonstrates understanding and expertise
            - Uses active voice and clear language
            - Includes specific details and benefits
            - Maintains a confident, professional tone`,
          },
          {
            role: 'user',
            content: `Generate content for the "${sectionTitle}" section.
            
            Requirements to address:
            ${requirements.join('\n')}
            
            Company context:
            ${context.companyInfo || 'N/A'}
            
            Client research:
            ${context.clientResearch || 'N/A'}
            
            Past similar content:
            ${context.pastProposals || 'N/A'}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      logger.error('Content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  /**
   * Check compliance of proposal content against requirements
   */
  async checkCompliance(
    proposalContent: string,
    requirements: Array<{ text: string; type: string }>
  ): Promise<{
    overallScore: number;
    missingRequirements: string[];
    suggestions: string[];
  }> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a compliance expert. Check if the proposal content addresses all requirements.
            
            Return a JSON object with:
            - overallScore (0-100)
            - missingRequirements (list of requirements not addressed)
            - suggestions (improvements to better address requirements)`,
          },
          {
            role: 'user',
            content: `Check compliance of this proposal:\n\n${proposalContent}\n\nAgainst these requirements:\n${JSON.stringify(requirements)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      return JSON.parse(result || '{}');
    } catch (error) {
      logger.error('Compliance check error:', error);
      throw new Error('Failed to check compliance');
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as { data: any };
      return data.data;
    } catch (error) {
      logger.error('Failed to fetch models:', error);
      throw error;
    }
  }
}