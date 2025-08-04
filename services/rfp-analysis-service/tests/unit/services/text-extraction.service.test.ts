import path from 'path';
import {
  mockLogger,
  mockDatabaseService,
  mockFs,
  mockPdfParse,
  resetAllMocks,
} from '../../mocks';
import { TextExtractionService } from '../../../src/services/text-extraction.service';
import {
  createTempTestFile,
  createTempPdfFile,
  cleanupTestFiles,
  expectError,
} from '../../utils/test-utils';

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({ logger: mockLogger }));
jest.mock('../../../src/services/database.service', () => ({ databaseService: mockDatabaseService }));
jest.mock('fs-extra', () => mockFs);
jest.mock('pdf-parse', () => mockPdfParse);

describe('TextExtractionService', () => {
  let textExtractionService: TextExtractionService;
  let tempFiles: string[] = [];

  beforeEach(() => {
    textExtractionService = new TextExtractionService();
    resetAllMocks();
  });

  afterEach(async () => {
    await cleanupTestFiles(tempFiles);
    tempFiles = [];
  });

  describe('extractText', () => {
    const testRfpId = 'test-rfp-123';

    describe('PDF extraction', () => {
      it('should successfully extract text from PDF files', async () => {
        const pdfPath = '/test/path/document.pdf';
        const expectedText = 'Extracted PDF content';
        
        mockPdfParse.mockResolvedValue({
          text: expectedText,
          numpages: 2,
          numrender: 2,
        });
        mockFs.readFile.mockResolvedValue(Buffer.from('pdf content'));

        await textExtractionService.extractText(testRfpId, pdfPath);

        expect(mockFs.readFile).toHaveBeenCalledWith(pdfPath);
        expect(mockPdfParse).toHaveBeenCalledWith(expect.any(Buffer));
        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: expectedText,
            textExtractedAt: expect.any(Date),
          }
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Text extraction completed',
          {
            rfpId: testRfpId,
            textLength: expectedText.length,
          }
        );
      });

      it('should handle PDF parsing errors', async () => {
        const pdfPath = '/test/path/corrupted.pdf';
        
        mockFs.readFile.mockResolvedValue(Buffer.from('corrupted content'));
        mockPdfParse.mockRejectedValue(new Error('Invalid PDF format'));

        await expectError(
          () => textExtractionService.extractText(testRfpId, pdfPath),
          'Invalid PDF format'
        );

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'error',
          {
            extractionError: 'Invalid PDF format',
          }
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Text extraction failed',
          {
            error: expect.any(Error),
            rfpId: testRfpId,
          }
        );
      });

      it('should handle file reading errors for PDFs', async () => {
        const pdfPath = '/test/path/missing.pdf';
        
        mockFs.readFile.mockRejectedValue(new Error('File not found'));

        await expectError(
          () => textExtractionService.extractText(testRfpId, pdfPath),
          'File not found'
        );

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'error',
          {
            extractionError: 'File not found',
          }
        );
      });

      it('should handle empty PDF files', async () => {
        const pdfPath = '/test/path/empty.pdf';
        
        mockFs.readFile.mockResolvedValue(Buffer.from(''));
        mockPdfParse.mockResolvedValue({
          text: '',
          numpages: 0,
          numrender: 0,
        });

        await textExtractionService.extractText(testRfpId, pdfPath);

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: '',
            textExtractedAt: expect.any(Date),
          }
        );
      });
    });

    describe('Text file extraction', () => {
      it('should successfully extract text from .txt files', async () => {
        const txtPath = '/test/path/document.txt';
        const expectedText = 'This is a text file content\nWith multiple lines';
        
        mockFs.readFile.mockResolvedValue(expectedText);

        await textExtractionService.extractText(testRfpId, txtPath);

        expect(mockFs.readFile).toHaveBeenCalledWith(txtPath, 'utf-8');
        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: expectedText,
            textExtractedAt: expect.any(Date),
          }
        );
      });

      it('should handle text file reading errors', async () => {
        const txtPath = '/test/path/missing.txt';
        
        mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

        await expectError(
          () => textExtractionService.extractText(testRfpId, txtPath),
          'Permission denied'
        );

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'error',
          {
            extractionError: 'Permission denied',
          }
        );
      });

      it('should handle empty text files', async () => {
        const txtPath = '/test/path/empty.txt';
        
        mockFs.readFile.mockResolvedValue('');

        await textExtractionService.extractText(testRfpId, txtPath);

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: '',
            textExtractedAt: expect.any(Date),
          }
        );
      });

      it('should handle large text files', async () => {
        const txtPath = '/test/path/large.txt';
        const largeText = 'A'.repeat(1000000); // 1MB of text
        
        mockFs.readFile.mockResolvedValue(largeText);

        await textExtractionService.extractText(testRfpId, txtPath);

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: largeText,
            textExtractedAt: expect.any(Date),
          }
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Text extraction completed',
          {
            rfpId: testRfpId,
            textLength: largeText.length,
          }
        );
      });
    });

    describe('Word document extraction', () => {
      it('should log warning for .doc files (not yet implemented)', async () => {
        const docPath = '/test/path/document.doc';

        await textExtractionService.extractText(testRfpId, docPath);

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Word document extraction not yet implemented',
          { rfpId: testRfpId }
        );
        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: 'Word document extraction pending implementation',
            textExtractedAt: expect.any(Date),
          }
        );
      });

      it('should log warning for .docx files (not yet implemented)', async () => {
        const docxPath = '/test/path/document.docx';

        await textExtractionService.extractText(testRfpId, docxPath);

        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Word document extraction not yet implemented',
          { rfpId: testRfpId }
        );
        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          {
            extractedText: 'Word document extraction pending implementation',
            textExtractedAt: expect.any(Date),
          }
        );
      });
    });

    describe('unsupported file types', () => {
      it('should throw error for unsupported file extensions', async () => {
        const unsupportedPath = '/test/path/document.xyz';

        await expectError(
          () => textExtractionService.extractText(testRfpId, unsupportedPath),
          'Unsupported file type: .xyz'
        );

        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'error',
          {
            extractionError: 'Unsupported file type: .xyz',
          }
        );
      });

      it('should handle files without extensions', async () => {
        const noExtPath = '/test/path/document';

        await expectError(
          () => textExtractionService.extractText(testRfpId, noExtPath),
          'Unsupported file type:'
        );
      });

      it('should handle paths with multiple dots', async () => {
        const multiDotPath = '/test/path/document.backup.pdf';

        await textExtractionService.extractText(testRfpId, multiDotPath);

        expect(mockPdfParse).toHaveBeenCalled();
      });
    });

    describe('database update errors', () => {
      it('should handle database update failures during successful extraction', async () => {
        const txtPath = '/test/path/document.txt';
        const expectedText = 'Test content';
        
        mockFs.readFile.mockResolvedValue(expectedText);
        mockDatabaseService.updateRfpStatus.mockRejectedValue(new Error('Database connection lost'));

        await expectError(
          () => textExtractionService.extractText(testRfpId, txtPath),
          'Database connection lost'
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Text extraction failed',
          {
            error: expect.any(Error),
            rfpId: testRfpId,
          }
        );
      });

      it('should handle database update failures during error state update', async () => {
        const txtPath = '/test/path/missing.txt';
        
        mockFs.readFile.mockRejectedValue(new Error('File not found'));
        mockDatabaseService.updateRfpStatus.mockRejectedValue(new Error('Database error'));

        await expectError(
          () => textExtractionService.extractText(testRfpId, txtPath),
          'Database error'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle file paths with special characters', async () => {
        const specialPath = '/test/path/document with spaces & symbols!@#.pdf';
        
        mockFs.readFile.mockResolvedValue(Buffer.from('pdf content'));
        mockPdfParse.mockResolvedValue({ text: 'Extracted text' });

        await textExtractionService.extractText(testRfpId, specialPath);

        expect(mockFs.readFile).toHaveBeenCalledWith(specialPath);
        expect(mockDatabaseService.updateRfpStatus).toHaveBeenCalledWith(
          testRfpId,
          'processing',
          expect.any(Object)
        );
      });

      it('should handle very long file paths', async () => {
        const longPath = '/test/' + 'a'.repeat(500) + '/document.txt';
        
        mockFs.readFile.mockResolvedValue('Test content');

        await textExtractionService.extractText(testRfpId, longPath);

        expect(mockFs.readFile).toHaveBeenCalledWith(longPath, 'utf-8');
      });

      it('should handle case-insensitive file extensions', async () => {
        const upperCasePath = '/test/path/DOCUMENT.PDF';
        
        mockFs.readFile.mockResolvedValue(Buffer.from('pdf content'));
        mockPdfParse.mockResolvedValue({ text: 'Extracted text' });

        await textExtractionService.extractText(testRfpId, upperCasePath);

        expect(mockPdfParse).toHaveBeenCalled();
      });

      it('should handle mixed case extensions', async () => {
        const mixedCasePath = '/test/path/document.Txt';
        
        mockFs.readFile.mockResolvedValue('Test content');

        await textExtractionService.extractText(testRfpId, mixedCasePath);

        expect(mockFs.readFile).toHaveBeenCalledWith(mixedCasePath, 'utf-8');
      });
    });

    describe('logging and monitoring', () => {
      it('should log extraction start and completion', async () => {
        const txtPath = '/test/path/document.txt';
        const expectedText = 'Test content';
        
        mockFs.readFile.mockResolvedValue(expectedText);

        await textExtractionService.extractText(testRfpId, txtPath);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Starting text extraction',
          { rfpId: testRfpId, filePath: txtPath }
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Text extraction completed',
          {
            rfpId: testRfpId,
            textLength: expectedText.length,
          }
        );
      });

      it('should log appropriate details for different file types', async () => {
        const pdfPath = '/test/path/document.pdf';
        
        mockFs.readFile.mockResolvedValue(Buffer.from('pdf'));
        mockPdfParse.mockResolvedValue({ text: 'PDF text' });

        await textExtractionService.extractText(testRfpId, pdfPath);

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Starting text extraction',
          { rfpId: testRfpId, filePath: pdfPath }
        );
      });
    });
  });
});