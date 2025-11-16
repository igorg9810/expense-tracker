import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logger } from '../helpers/Logger';
import { InvoiceAnalysisService } from './invoice-analysis.service';
import { fileUploadSchema } from './dto/file-upload.dto';
import { InvoiceAnalysisResponse, InvoiceAnalysisErrorResponse } from './dto/invoice-analysis.dto';

/**
 * Controller for invoice analysis endpoints
 */
export class InvoiceAnalysisController {
  private invoiceAnalysisService: InvoiceAnalysisService;

  constructor() {
    this.invoiceAnalysisService = new InvoiceAnalysisService();
  }

  /**
   * Analyzes an uploaded invoice image
   */
  async analyzeInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Processing invoice analysis request');

      // Check if file was uploaded
      if (!req.file) {
        logger.warn('No file uploaded in request');
        res.status(400).json({
          error: 'No file uploaded. Please upload a JPG image.',
        } as InvoiceAnalysisErrorResponse);
        return;
      }

      // Validate file upload
      try {
        fileUploadSchema.parse(req.file);
      } catch (validationError) {
        logger.warn('File validation failed:', validationError);
        res.status(400).json({
          error: 'Invalid file format or size',
          details:
            validationError instanceof Error ? validationError.message : 'File validation failed',
        } as InvoiceAnalysisErrorResponse);
        return;
      }

      // Analyze the invoice
      const analysisResult = await this.invoiceAnalysisService.analyzeInvoice(req.file.buffer);

      logger.info('Invoice analysis completed successfully');
      res.status(200).json(analysisResult as InvoiceAnalysisResponse);
    } catch (error) {
      logger.error('Invoice analysis failed:', error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (
          error.message.includes('No text could be extracted') ||
          error.message.includes('Could not extract a valid amount')
        ) {
          res.status(422).json({
            error: 'Could not parse the invoice image',
            details: error.message,
          } as InvoiceAnalysisErrorResponse);
          return;
        }
      }

      // Pass unexpected errors to error handler middleware
      next(error);
    }
  }
}

/**
 * Multer configuration for file uploads
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(), // Store in memory, don't save to disk
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow one file
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG/JPEG files are allowed'));
    }
  },
});

// Export singleton instance
export const invoiceAnalysisController = new InvoiceAnalysisController();
