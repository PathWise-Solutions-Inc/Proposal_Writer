import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { databaseService } from './database.service';
import { textExtractionService } from './text-extraction.service';
import { analysisQueueService } from './analysis-queue.service';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const PERMANENT_DIR = path.join(UPLOAD_DIR, 'rfps');

// Ensure directories exist
fs.ensureDirSync(PERMANENT_DIR);

interface UploadOptions {
  file: Express.Multer.File;
  userId: string;
  organizationId: string;
  metadata: {
    title: string;
    clientName: string;
    dueDate?: string;
    description?: string;
  };
}

interface UploadResult {
  rfpId: string;
  originalFileName: string;
  fileSize: number;
  fileHash: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  message: string;
}

export class UploadService {
  async processUpload(options: UploadOptions): Promise<UploadResult> {
    const { file, userId, organizationId, metadata } = options;
    const rfpId = uuidv4();

    try {
      // Calculate file hash for deduplication
      const fileHash = await this.calculateFileHash(file.path);

      // Check for duplicate uploads
      const existingRfp = await databaseService.findRfpByHash(fileHash, organizationId);
      if (existingRfp) {
        // Clean up temp file
        await fs.remove(file.path);
        
        return {
          rfpId: existingRfp.id,
          originalFileName: file.originalname,
          fileSize: file.size,
          fileHash,
          status: existingRfp.status,
          message: 'This RFP has already been uploaded'
        };
      }

      // Move file to permanent storage
      const permanentPath = path.join(PERMANENT_DIR, `${rfpId}${path.extname(file.originalname)}`);
      await fs.move(file.path, permanentPath);

      // Create RFP record in database
      const rfpRecord = await databaseService.createRfp({
        id: rfpId,
        title: metadata.title,
        clientName: metadata.clientName,
        dueDate: metadata.dueDate ? new Date(metadata.dueDate) : null,
        description: metadata.description,
        organizationId,
        uploadedById: userId,
        metadata: {
          originalFileName: file.originalname,
          fileSize: file.size,
          fileHash,
          filePath: permanentPath,
          mimeType: file.mimetype
        },
        status: 'uploaded'
      });

      // Start async text extraction
      await textExtractionService.extractText(rfpId, permanentPath);

      // Queue for AI analysis
      await analysisQueueService.queueForAnalysis(rfpId);

      logger.info('RFP upload processed successfully', {
        rfpId,
        fileName: file.originalname,
        fileSize: file.size
      });

      return {
        rfpId,
        originalFileName: file.originalname,
        fileSize: file.size,
        fileHash,
        status: 'processing',
        message: 'RFP uploaded successfully and queued for analysis'
      };
    } catch (error) {
      logger.error('Error processing RFP upload', {
        error,
        rfpId,
        fileName: file.originalname
      });

      // Clean up on error
      if (file.path && await fs.pathExists(file.path)) {
        await fs.remove(file.path);
      }

      // Update status if record was created
      if (rfpId) {
        await databaseService.updateRfpStatus(rfpId, 'error', {
          error: error.message
        });
      }

      throw error;
    }
  }

  async getUploadStatus(rfpId: string) {
    const rfp = await databaseService.getRfpById(rfpId);
    if (!rfp) {
      return null;
    }

    return {
      rfpId: rfp.id,
      title: rfp.title,
      status: rfp.status,
      uploadedAt: rfp.createdAt,
      analysisResults: rfp.analysisResults,
      extractedText: rfp.status === 'analyzed' ? !!rfp.extractedText : undefined
    };
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}

export const uploadService = new UploadService();