import { logger } from '../utils/logger';
import { databaseService } from './database.service';
import pdfParse from 'pdf-parse';
import fs from 'fs-extra';
import path from 'path';

export class TextExtractionService {
  async extractText(rfpId: string, filePath: string): Promise<void> {
    try {
      logger.info('Starting text extraction', { rfpId, filePath });
      
      const ext = path.extname(filePath).toLowerCase();
      let extractedText = '';

      switch (ext) {
        case '.pdf':
          extractedText = await this.extractPdfText(filePath);
          break;
        case '.txt':
          extractedText = await fs.readFile(filePath, 'utf-8');
          break;
        case '.doc':
        case '.docx':
          // TODO: Implement Word document extraction
          logger.warn('Word document extraction not yet implemented', { rfpId });
          extractedText = 'Word document extraction pending implementation';
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      // Update RFP with extracted text
      await databaseService.updateRfpStatus(rfpId, 'processing', {
        extractedText,
        textExtractedAt: new Date()
      });

      logger.info('Text extraction completed', { 
        rfpId, 
        textLength: extractedText.length 
      });
    } catch (error) {
      logger.error('Text extraction failed', { error, rfpId });
      await databaseService.updateRfpStatus(rfpId, 'error', {
        extractionError: error.message
      });
      throw error;
    }
  }

  private async extractPdfText(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }
}

export const textExtractionService = new TextExtractionService();