import { OpenRouterService } from '../../../ai-service/src/services/openrouter.service';
import { databaseService } from './database.service';
import { logger } from '../utils/logger';
import { RFP } from '../../../auth-service/src/models/RFP';

export class RfpAnalysisService {
  private openRouterService: OpenRouterService;

  constructor() {
    this.openRouterService = new OpenRouterService();
  }

  /**
   * Analyze an RFP document and generate evaluation rubric
   */
  async analyzeRfp(rfpId: string): Promise<void> {
    try {
      logger.info('Starting RFP analysis', { rfpId });

      // Get RFP from database
      const rfp = await databaseService.getRfpById(rfpId);
      if (!rfp) {
        throw new Error(`RFP not found: ${rfpId}`);
      }

      if (!rfp.extractedText) {
        throw new Error(`No extracted text found for RFP: ${rfpId}`);
      }

      // Update status to processing
      await databaseService.updateRfpStatus(rfpId, 'processing');

      // Step 1: Analyze RFP and extract requirements
      logger.info('Extracting requirements from RFP', { rfpId });
      const analysisResult = await this.openRouterService.analyzeRFP(rfp.extractedText);

      // Step 2: Generate evaluation rubric
      logger.info('Generating evaluation rubric', { rfpId });
      const rubric = await this.openRouterService.generateRubric(
        rfp.extractedText,
        analysisResult.requirements
      );

      // Step 3: Extract additional metadata
      const metadata = this.extractAdditionalMetadata(rfp.extractedText);

      // Step 4: Save analysis results to database
      const analysisResults = {
        evaluationCriteria: rubric.categories.map(category => ({
          criterion: category.name,
          weight: category.weight,
          description: category.description,
          maxPoints: category.maxPoints,
          scoringCriteria: category.criteria
        })),
        requirements: analysisResult.requirements.map((req, index) => ({
          id: `REQ-${index + 1}`,
          text: req.text,
          category: req.section,
          mandatory: req.type === 'mandatory'
        })),
        keyDates: metadata.keyDates,
        budgetRange: metadata.budgetRange,
        summary: analysisResult.summary,
        keywords: analysisResult.keywords,
        totalPoints: rubric.totalPoints,
        confidenceScore: rubric.confidenceScore,
        analysisCompletedAt: new Date()
      };

      // Update RFP with analysis results
      await this.updateRfpWithAnalysis(rfpId, analysisResults);

      logger.info('RFP analysis completed successfully', {
        rfpId,
        requirementsCount: analysisResult.requirements.length,
        rubricCategories: rubric.categories.length,
        confidenceScore: rubric.confidenceScore
      });

    } catch (error) {
      logger.error('RFP analysis failed', { error, rfpId });
      await databaseService.updateRfpStatus(rfpId, 'error', {
        analysisError: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Extract additional metadata from RFP text
   */
  private extractAdditionalMetadata(text: string): {
    keyDates: Array<{ event: string; date: Date | null }>;
    budgetRange: { min?: number; max?: number; currency?: string } | null;
  } {
    const keyDates: Array<{ event: string; date: Date | null }> = [];
    const budgetRange: { min?: number; max?: number; currency?: string } | null = null;

    // Extract dates (basic regex pattern)
    const datePatterns = [
      /submission\s+(?:date|deadline)[:\s]+([A-Za-z]+ \d{1,2},? \d{4})/gi,
      /due\s+(?:date|by)[:\s]+([A-Za-z]+ \d{1,2},? \d{4})/gi,
      /proposal\s+due[:\s]+([A-Za-z]+ \d{1,2},? \d{4})/gi,
      /questions?\s+due[:\s]+([A-Za-z]+ \d{1,2},? \d{4})/gi
    ];

    for (const pattern of datePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const dateStr = match[1];
        const event = match[0].split(/[:\s]+/)[0];
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            keyDates.push({ event, date });
          }
        } catch {
          // Invalid date format, skip
        }
      }
    }

    // Extract budget (basic pattern)
    const budgetPattern = /budget[:\s]+\$?([\d,]+(?:\.\d{2})?)\s*(?:to|-)\s*\$?([\d,]+(?:\.\d{2})?)/gi;
    const budgetMatch = budgetPattern.exec(text);
    if (budgetMatch) {
      const min = parseFloat(budgetMatch[1].replace(/,/g, ''));
      const max = parseFloat(budgetMatch[2].replace(/,/g, ''));
      return {
        keyDates,
        budgetRange: { min, max, currency: 'USD' }
      };
    }

    return { keyDates, budgetRange };
  }

  /**
   * Update RFP with analysis results
   */
  private async updateRfpWithAnalysis(rfpId: string, analysisResults: any): Promise<void> {
    try {
      // Get current RFP
      const rfp = await databaseService.getRfpById(rfpId);
      if (!rfp) {
        throw new Error(`RFP not found: ${rfpId}`);
      }

      // Update with TypeORM
      const repository = (await import('../config/database')).AppDataSource.getRepository(RFP);
      await repository.update(
        { id: rfpId },
        {
          status: 'analyzed',
          analysisResults
        }
      );

      logger.info('RFP updated with analysis results', { rfpId });
    } catch (error) {
      logger.error('Failed to update RFP with analysis', { error, rfpId });
      throw error;
    }
  }

  /**
   * Get analysis status for an RFP
   */
  async getAnalysisStatus(rfpId: string): Promise<{
    status: string;
    progress?: number;
    results?: any;
    error?: string;
  }> {
    const rfp = await databaseService.getRfpById(rfpId);
    if (!rfp) {
      throw new Error(`RFP not found: ${rfpId}`);
    }

    return {
      status: rfp.status,
      progress: this.calculateProgress(rfp),
      results: rfp.status === 'analyzed' ? rfp.analysisResults : undefined,
      error: rfp.metadata?.analysisError
    };
  }

  /**
   * Calculate analysis progress based on RFP status
   */
  private calculateProgress(rfp: RFP): number {
    switch (rfp.status) {
      case 'uploaded':
        return 10;
      case 'processing':
        return rfp.extractedText ? 50 : 30;
      case 'analyzed':
        return 100;
      case 'error':
        return 0;
      default:
        return 0;
    }
  }
}

export const rfpAnalysisService = new RfpAnalysisService();