import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { uploadService } from '../services/upload.service';
import { logger } from '../utils/logger';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'text/rtf'
];

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR);

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(UPLOAD_DIR, 'temp');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type ${ext} is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return cb(new Error(`MIME type ${mimeType} is not allowed.`));
    }

    cb(null, true);
  }
}).single('rfpDocument');

export class UploadController {
  async uploadRFP(req: Request, res: Response, next: NextFunction) {
    try {
      // Handle file upload with multer
      upload(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(413).json({
                error: 'File too large',
                message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
              });
            }
            return res.status(400).json({
              error: 'Upload error',
              message: err.message
            });
          }
          return res.status(400).json({
            error: 'Upload error',
            message: err.message
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: 'No file uploaded',
            message: 'Please provide an RFP document'
          });
        }

        try {
          // Validate required fields
          if (!req.body.clientName) {
            return res.status(400).json({
              error: 'Validation error',
              message: 'clientName is required'
            });
          }

          // Process the uploaded file
          const uploadResult = await uploadService.processUpload({
            file: req.file,
            userId: req.user?.id || 'unknown',
            organizationId: req.user?.organizationId || 'default-org',
            metadata: {
              title: req.body.title || req.file.originalname,
              clientName: req.body.clientName,
              dueDate: req.body.dueDate,
              description: req.body.description
            }
          });

          logger.info('RFP uploaded successfully', {
            rfpId: uploadResult.rfpId,
            filename: req.file.originalname,
            userId: req.user?.id
          });

          res.status(201).json({
            message: 'RFP uploaded successfully',
            data: uploadResult
          });
        } catch (error) {
          // Clean up temp file on error
          if (req.file?.path) {
            await fs.remove(req.file.path).catch(() => {});
          }
          throw error;
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUploadStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { rfpId } = req.params;
      const status = await uploadService.getUploadStatus(rfpId);

      if (!status) {
        return res.status(404).json({
          error: 'RFP not found'
        });
      }

      res.json({ data: status });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();