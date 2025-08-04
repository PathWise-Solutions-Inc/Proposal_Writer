import { Request, Response, NextFunction } from 'express';
import { rfpAnalysisService } from '../services/rfp-analysis.service';
import { analysisQueueService } from '../services/analysis-queue.service';
import { databaseService } from '../services/database.service';
import { logger } from '../utils/logger';

export class AnalysisController {
  /**
   * Manually trigger analysis for an RFP
   */
  async triggerAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfpId } = req.params;
      const { priority = 1 } = req.body;

      // Check if RFP exists and belongs to user's organization
      const rfp = await databaseService.getRfpById(rfpId);
      if (!rfp) {
        return res.status(404).json({
          error: 'RFP not found'
        });
      }

      // Verify user has access to this RFP
      if (rfp.organizationId !== req.user?.organizationId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Check if already analyzed
      if (rfp.status === 'analyzed') {
        return res.status(400).json({
          error: 'RFP already analyzed',
          message: 'This RFP has already been analyzed. Use GET /analysis to retrieve results.'
        });
      }

      // Check if analysis is in progress
      if (rfp.status === 'processing') {
        return res.status(400).json({
          error: 'Analysis in progress',
          message: 'Analysis is already in progress for this RFP.'
        });
      }

      // Queue for analysis
      const job = await analysisQueueService.queueForAnalysis(rfpId, priority);

      logger.info('Analysis triggered manually', {
        rfpId,
        userId: req.user?.id,
        jobId: job.id
      });

      res.status(202).json({
        message: 'Analysis queued successfully',
        data: {
          rfpId,
          jobId: job.id,
          status: 'queued'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get analysis results for an RFP
   */
  async getAnalysisResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfpId } = req.params;

      // Get RFP with analysis results
      const rfp = await databaseService.getRfpById(rfpId);
      if (!rfp) {
        return res.status(404).json({
          error: 'RFP not found'
        });
      }

      // Verify user has access
      if (rfp.organizationId !== req.user?.organizationId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Get analysis status
      const status = await rfpAnalysisService.getAnalysisStatus(rfpId);

      res.json({
        data: {
          rfpId,
          title: rfp.title,
          clientName: rfp.clientName,
          status: status.status,
          progress: status.progress,
          analysisResults: status.results,
          error: status.error
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get evaluation rubric for an RFP
   */
  async getEvaluationRubric(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfpId } = req.params;

      // Get RFP
      const rfp = await databaseService.getRfpById(rfpId);
      if (!rfp) {
        return res.status(404).json({
          error: 'RFP not found'
        });
      }

      // Verify user has access
      if (rfp.organizationId !== req.user?.organizationId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Check if analyzed
      if (rfp.status !== 'analyzed' || !rfp.analysisResults) {
        return res.status(400).json({
          error: 'RFP not analyzed',
          message: 'This RFP has not been analyzed yet. Please trigger analysis first.'
        });
      }

      // Extract rubric from analysis results
      const rubric = {
        rfpId,
        title: rfp.title,
        evaluationCriteria: rfp.analysisResults.evaluationCriteria || [],
        totalPoints: rfp.analysisResults.totalPoints || 100,
        confidenceScore: rfp.analysisResults.confidenceScore || 0,
        generatedAt: rfp.analysisResults.analysisCompletedAt
      };

      res.json({ data: rubric });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await analysisQueueService.getQueueStats();

      res.json({
        data: {
          queue: 'rfp-analysis',
          stats,
          timestamp: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analysisController = new AnalysisController();