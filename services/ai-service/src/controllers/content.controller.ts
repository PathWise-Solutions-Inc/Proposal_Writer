import { Request, Response } from 'express';
import { OpenRouterService } from '../services/openrouter.service';
import { logger } from '../utils/logger';
import { ContentGenerationRequest } from '../types/content.types';

export class ContentController {
  private openRouterService: OpenRouterService;

  constructor() {
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Generate content for a proposal section
   */
  generateContent = async (req: Request, res: Response) => {
    try {
      const {
        sectionTitle,
        sectionType,
        requirements,
        context,
        tone,
        maxLength,
        variations
      }: ContentGenerationRequest = req.body;

      logger.info('Generating content for section:', { sectionTitle, sectionType });

      // Generate multiple variations if requested
      const generatedVariations = [];
      const numVariations = variations || 1;

      for (let i = 0; i < numVariations; i++) {
        const content = await this.openRouterService.generateContent(
          sectionTitle,
          requirements || [],
          {
            companyInfo: context?.companyInfo,
            pastProposals: context?.pastProposals,
            clientResearch: context?.clientResearch
          }
        );

        generatedVariations.push({
          id: `variation-${i + 1}`,
          content,
          tone: tone || 'professional',
          wordCount: content.split(/\s+/).length
        });
      }

      res.json({
        success: true,
        data: {
          sectionTitle,
          sectionType,
          variations: generatedVariations,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Content generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate content',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Generate content based on RFP requirements
   */
  generateFromRFP = async (req: Request, res: Response) => {
    try {
      const { rfpId, sectionId, proposalId } = req.body;

      // TODO: Fetch RFP requirements from database
      // TODO: Fetch section details from database
      // TODO: Fetch proposal context from database

      logger.info('Generating content from RFP:', { rfpId, sectionId, proposalId });

      // For now, return a placeholder response
      res.json({
        success: true,
        data: {
          message: 'RFP-based content generation endpoint',
          rfpId,
          sectionId,
          proposalId
        }
      });
    } catch (error) {
      logger.error('RFP content generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate content from RFP'
      });
    }
  };

  /**
   * Refine existing content with AI
   */
  refineContent = async (req: Request, res: Response) => {
    try {
      const { content, improvements, tone } = req.body;

      logger.info('Refining content with improvements:', improvements);

      // TODO: Implement content refinement
      res.json({
        success: true,
        data: {
          refinedContent: content,
          improvements: improvements,
          tone: tone || 'professional'
        }
      });
    } catch (error) {
      logger.error('Content refinement error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refine content'
      });
    }
  };

  /**
   * Check content compliance
   */
  checkCompliance = async (req: Request, res: Response) => {
    try {
      const { content, requirements } = req.body;

      logger.info('Checking content compliance');

      const complianceResult = await this.openRouterService.checkCompliance(
        content,
        requirements
      );

      res.json({
        success: true,
        data: complianceResult
      });
    } catch (error) {
      logger.error('Compliance check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check compliance'
      });
    }
  };
}