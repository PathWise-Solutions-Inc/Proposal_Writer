import { logger } from '../utils/logger';
import { databaseService } from './database.service';
import pdfParse from 'pdf-parse';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

export interface TextExtractionResult {
  text: string;
  metadata: {
    contentType: string;
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    language?: string;
    title?: string;
    author?: string;
    createdDate?: Date;
    modifiedDate?: Date;
  };
  extractionMethod: 'tika' | 'fallback';
  extractionTime: number;
}

export class TextExtractionService {
  private tikaUrl: string;
  private timeoutMs: number;

  constructor() {
    this.tikaUrl = process.env.TIKA_SERVER_URL || 'http://localhost:9998';
    this.timeoutMs = parseInt(process.env.TIKA_TIMEOUT_MS || '30000');
  }

  async extractText(rfpId: string, filePath: string): Promise<void> {
    try {
      logger.info('Starting text extraction', { rfpId, filePath });
      
      // Use new Tika-based extraction
      const result = await this.extractTextWithTika(filePath);
      
      // Update RFP with extracted text and metadata
      await databaseService.updateRfpStatus(rfpId, 'processing', {
        extractedText: result.text,
        textExtractedAt: new Date(),
        textMetadata: result.metadata,
        extractionMethod: result.extractionMethod,
        extractionTime: result.extractionTime
      });

      logger.info('Text extraction completed', { 
        rfpId, 
        textLength: result.text.length,
        method: result.extractionMethod,
        time: result.extractionTime
      });
    } catch (error) {
      logger.error('Text extraction failed', { error, rfpId });
      await databaseService.updateRfpStatus(rfpId, 'error', {
        extractionError: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Extract text from a file using Apache Tika with fallback
   */
  async extractTextWithTika(filePath: string): Promise<TextExtractionResult> {
    const startTime = Date.now();
    
    try {
      // First try Tika extraction
      const result = await this.extractWithTika(filePath);
      result.extractionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      logger.warn('Tika extraction failed, attempting fallback', {
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fall back to basic extraction methods
      try {
        const result = await this.extractWithFallback(filePath);
        result.extractionTime = Date.now() - startTime;
        return result;
      } catch (fallbackError) {
        logger.error('All text extraction methods failed', {
          filePath,
          tikaError: error instanceof Error ? error.message : 'Unknown error',
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        });
        
        throw new Error('Failed to extract text from document');
      }
    }
  }

  /**
   * Extract text using Apache Tika server
   */
  private async extractWithTika(filePath: string): Promise<TextExtractionResult> {
    if (!await fs.pathExists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = await fs.readFile(filePath);

    try {
      // Extract text content
      const textResponse = await axios.put(
        `${this.tikaUrl}/tika`,
        fileBuffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Accept': 'text/plain'
          },
          timeout: this.timeoutMs,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      // Extract metadata
      const metadataResponse = await axios.put(
        `${this.tikaUrl}/meta`,
        fileBuffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Accept': 'application/json'
          },
          timeout: this.timeoutMs,
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      const text = textResponse.data;
      const metadata = metadataResponse.data;

      // Clean and normalize extracted text
      const cleanedText = this.cleanExtractedText(text);

      return {
        text: cleanedText,
        metadata: {
          contentType: metadata['Content-Type'] || 'unknown',
          pageCount: this.parsePageCount(metadata),
          wordCount: this.countWords(cleanedText),
          characterCount: cleanedText.length,
          language: metadata['dc:language'] || metadata['language'],
          title: metadata['dc:title'] || metadata['title'],
          author: metadata['dc:creator'] || metadata['Author'] || metadata['author'],
          createdDate: this.parseDate(metadata['dcterms:created'] || metadata['meta:creation-date']),
          modifiedDate: this.parseDate(metadata['dcterms:modified'] || metadata['meta:save-date'])
        },
        extractionMethod: 'tika',
        extractionTime: 0 // Will be set by caller
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Tika server is not available');
        }
        if (error.response?.status === 422) {
          throw new Error('Document format not supported by Tika');
        }
        if (error.response?.status === 500) {
          throw new Error('Tika server internal error');
        }
      }
      throw error;
    }
  }

  /**
   * Fallback text extraction for basic file types
   */
  private async extractWithFallback(filePath: string): Promise<TextExtractionResult> {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.txt':
        const text = await fs.readFile(filePath, 'utf-8');
        const cleanedText = this.cleanExtractedText(text);
        
        return {
          text: cleanedText,
          metadata: {
            contentType: 'text/plain',
            wordCount: this.countWords(cleanedText),
            characterCount: cleanedText.length
          },
          extractionMethod: 'fallback',
          extractionTime: 0
        };
      
      case '.pdf':
        const pdfText = await this.extractPdfText(filePath);
        const cleanedPdfText = this.cleanExtractedText(pdfText);
        
        return {
          text: cleanedPdfText,
          metadata: {
            contentType: 'application/pdf',
            wordCount: this.countWords(cleanedPdfText),
            characterCount: cleanedPdfText.length
          },
          extractionMethod: 'fallback',
          extractionTime: 0
        };
      
      default:
        throw new Error(`No fallback extraction method available for ${ext} files`);
    }
  }

  private async extractPdfText(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanExtractedText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Parse page count from metadata
   */
  private parsePageCount(metadata: any): number | undefined {
    const pageCountFields = [
      'xmpTPg:NPages',
      'meta:page-count',
      'Page-Count',
      'pdf:pageCount'
    ];

    for (const field of pageCountFields) {
      if (metadata[field]) {
        const count = parseInt(metadata[field]);
        if (!isNaN(count) && count > 0) {
          return count;
        }
      }
    }

    return undefined;
  }

  /**
   * Parse date from metadata
   */
  private parseDate(dateString: string | undefined): Date | undefined {
    if (!dateString) return undefined;
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if Tika server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.tikaUrl}/tika`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const textExtractionService = new TextExtractionService();