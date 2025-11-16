import { Request, Response, NextFunction } from 'express';
import { InvoiceAnalysisController } from '../../src/invoices/invoice-analysis.controller';
import { InvoiceAnalysisService } from '../../src/invoices/invoice-analysis.service';

// Mock the service
jest.mock('../../src/invoices/invoice-analysis.service');

const MockedInvoiceAnalysisService = InvoiceAnalysisService as jest.MockedClass<
  typeof InvoiceAnalysisService
>;

describe('InvoiceAnalysisController', () => {
  let controller: InvoiceAnalysisController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockService: jest.Mocked<InvoiceAnalysisService>;

  beforeEach(() => {
    // Setup service mock first
    mockService = {
      analyzeInvoice: jest.fn(),
    } as any;

    MockedInvoiceAnalysisService.mockImplementation(() => mockService);

    // Create controller after mocking
    controller = new InvoiceAnalysisController();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('analyzeInvoice', () => {
    it('should successfully analyze invoice when file is valid', async () => {
      // Setup
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test-invoice.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from('test-image-data'),
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      const expectedResult = {
        name: 'Test Company',
        amount: 123.45,
        currency: 'USD' as const,
        date: '2024-01-15',
      };

      mockService.analyzeInvoice.mockResolvedValue(expectedResult);

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockService.analyzeInvoice).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when no file is uploaded', async () => {
      // Setup
      mockRequest = {}; // No file

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No file uploaded. Please upload a JPG image.',
      });
      expect(mockService.analyzeInvoice).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid file type', async () => {
      // Setup
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png', // Invalid type
        size: 1024,
        buffer: Buffer.from('test-data'),
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid file format or size',
        details: expect.stringContaining('JPG/JPEG'),
      });
      expect(mockService.analyzeInvoice).not.toHaveBeenCalled();
    });

    it('should return 400 for file too large', async () => {
      // Setup
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test-invoice.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024, // 6MB - too large
        buffer: Buffer.from('test-image-data'),
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid file format or size',
        details: expect.stringContaining('5MB'),
      });
    });

    it('should return 422 when invoice cannot be parsed', async () => {
      // Setup
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test-invoice.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-image-data'),
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      const analysisError = new Error('No text could be extracted from the image');
      mockService.analyzeInvoice.mockRejectedValue(analysisError);

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Could not parse the invoice image',
        details: 'No text could be extracted from the image',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 422 when amount cannot be extracted', async () => {
      // Setup
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test-invoice.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-image-data'),
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      const analysisError = new Error('Could not extract a valid amount from the invoice');
      mockService.analyzeInvoice.mockRejectedValue(analysisError);

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Could not parse the invoice image',
        details: 'Could not extract a valid amount from the invoice',
      });
    });

    it('should pass unexpected errors to error handler middleware', async () => {
      // Setup
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test-invoice.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test-image-data'),
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      const unexpectedError = new Error('Unexpected server error');
      mockService.analyzeInvoice.mockRejectedValue(unexpectedError);

      // Act
      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle various file validation scenarios', async () => {
      const testCases = [
        {
          file: {
            fieldname: 'invoice',
            originalname: 'test.jpeg', // Different extension but valid mimetype
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 1024,
            buffer: Buffer.from('test'),
          },
          shouldPass: true,
        },
        {
          file: {
            fieldname: 'invoice',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 5 * 1024 * 1024, // Exactly 5MB
            buffer: Buffer.from('test'),
          },
          shouldPass: true,
        },
        {
          file: {
            fieldname: 'invoice',
            originalname: 'test.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 5 * 1024 * 1024 + 1, // Just over 5MB
            buffer: Buffer.from('test'),
          },
          shouldPass: false,
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        mockRequest = { file: testCase.file as Express.Multer.File };

        if (testCase.shouldPass) {
          mockService.analyzeInvoice.mockResolvedValue({
            name: 'Test',
            amount: 100,
            currency: 'USD',
            date: '2024-01-01',
          });
        }

        await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

        if (testCase.shouldPass) {
          expect(mockService.analyzeInvoice).toHaveBeenCalled();
        } else {
          expect(mockResponse.status).toHaveBeenCalledWith(400);
        }
      }
    });
  });

  describe('file validation edge cases', () => {
    it('should handle missing buffer', async () => {
      const mockFile = {
        fieldname: 'invoice',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        // Missing buffer
      } as Express.Multer.File;

      mockRequest = { file: mockFile };

      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle malformed file object', async () => {
      mockRequest = {
        file: {} as Express.Multer.File, // Empty file object
      };

      await controller.analyzeInvoice(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
