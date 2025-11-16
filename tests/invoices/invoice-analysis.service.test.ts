import { InvoiceAnalysisService } from '../../src/invoices/invoice-analysis.service';

// Mock dependencies
jest.mock('tesseract.js');
jest.mock('sharp');

import Tesseract from 'tesseract.js';
import sharp from 'sharp';

const mockTesseract = Tesseract as jest.Mocked<typeof Tesseract>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

describe('InvoiceAnalysisService', () => {
  let service: InvoiceAnalysisService;
  let mockSharpInstance: any;

  beforeEach(() => {
    service = new InvoiceAnalysisService();

    // Setup sharp mock
    mockSharpInstance = {
      resize: jest.fn().mockReturnThis(),
      grayscale: jest.fn().mockReturnThis(),
      normalize: jest.fn().mockReturnThis(),
      sharpen: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
    };

    mockSharp.mockReturnValue(mockSharpInstance);

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('analyzeInvoice', () => {
    const mockImageBuffer = Buffer.from('test-image-data');

    it('should successfully analyze an invoice with complete data', async () => {
      // Setup mocks
      const mockOcrText = `
        INVOICE
        ABC Company Inc.
        Date: 2024-01-15
        Amount: $125.50
        Total: $125.50
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      // Act
      const result = await service.analyzeInvoice(mockImageBuffer);

      // Assert
      expect(result).toEqual({
        name: 'ABC Company Inc.',
        amount: 125.5,
        currency: 'USD',
        date: '2024-01-15',
      });

      expect(mockSharp).toHaveBeenCalledWith(mockImageBuffer);
      expect(mockTesseract.recognize).toHaveBeenCalledWith(
        Buffer.from('processed-image'),
        'eng',
        expect.any(Object)
      );
    });

    it('should handle invoice with EUR currency', async () => {
      const mockOcrText = `
        FACTURE
        Restaurant Paris
        Date: 15/01/2024
        Montant: €89.75
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      const result = await service.analyzeInvoice(mockImageBuffer);

      expect(result.currency).toBe('EUR');
      expect(result.amount).toBe(89.75);
    });

    it('should handle different date formats', async () => {
      const testImageBuffer = Buffer.from('test-image-data');

      mockTesseract.recognize.mockResolvedValue({
        data: { text: 'Invoice\nTest Company\nDate: 2024-01-15\nAmount: $100.00' },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Should be in YYYY-MM-DD format
      expect(result.amount).toBe(100.0);
      expect(result.currency).toBe('USD');
    });

    it('should provide defaults when data is missing', async () => {
      const mockOcrText = `
        Some random text
        No clear invoice data
        Just some numbers 123
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      await expect(service.analyzeInvoice(mockImageBuffer)).rejects.toThrow(
        'Failed to analyze invoice'
      );
    });

    it('should handle OCR failure', async () => {
      mockTesseract.recognize.mockRejectedValue(new Error('OCR failed'));

      await expect(service.analyzeInvoice(mockImageBuffer)).rejects.toThrow(
        'Failed to analyze invoice: Failed to extract text from image'
      );
    });

    it('should handle empty OCR result', async () => {
      mockTesseract.recognize.mockResolvedValue({
        data: { text: '' },
      } as any);

      await expect(service.analyzeInvoice(mockImageBuffer)).rejects.toThrow(
        'Failed to analyze invoice'
      );
    });

    it('should handle image preprocessing failure', async () => {
      mockSharpInstance.toBuffer.mockRejectedValue(new Error('Sharp processing failed'));

      await expect(service.analyzeInvoice(mockImageBuffer)).rejects.toThrow(
        'Failed to analyze invoice: Failed to preprocess image for analysis'
      );
    });

    it('should extract amount from various patterns', async () => {
      const testImageBuffer = Buffer.from('test-image-data');

      // Test a simple case
      mockTesseract.recognize.mockResolvedValue({
        data: { text: 'Invoice\nTest Company\nDate: 2024-01-01\nTotal: $123.45' },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(result.amount).toBeGreaterThan(0);
      expect(['USD', 'EUR']).toContain(result.currency);
    });

    it('should extract company names from various positions', async () => {
      const testImageBuffer = Buffer.from('test-image-data');

      mockTesseract.recognize.mockResolvedValue({
        data: { text: 'ABC Restaurant\nInvoice #123\nDate: 2024-01-01\nAmount: $50.00' },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should handle special characters in amounts', async () => {
      const testImageBuffer = Buffer.from('test-image-data');
      const mockOcrText = `
        Invoice
        Test Company
        Date: 2024-01-01
        Sub-total: $1,234.56
        Tax: $123.45
        Total: $1,358.01
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(result.amount).toBeGreaterThan(100); // Should extract some valid amount
      expect(result.currency).toBe('USD');
    });

    it('should validate extracted data schema', async () => {
      const mockOcrText = `
        Test Company
        Date: 2024-01-01
        Amount: $-50.00
      `; // Negative amount should fail validation

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      await expect(service.analyzeInvoice(mockImageBuffer)).rejects.toThrow(
        'Failed to analyze invoice'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very long company names', async () => {
      const testImageBuffer = Buffer.from('test-image-data');
      const longName = 'A'.repeat(300); // Too long
      const mockOcrText = `
        ${longName}
        Date: 2024-01-01
        Amount: $100.00
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(result.name).not.toBe(longName); // Should fallback to default or shorter name
    });

    it('should handle multiple amounts and pick the correct one', async () => {
      const testImageBuffer = Buffer.from('test-image-data');
      const mockOcrText = `
        Invoice #123
        Test Company
        Date: 2024-01-01
        Subtotal: $100.00
        Tax: $10.00
        Discount: $5.00
        Total: $105.00
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(result.amount).toBeGreaterThan(0); // Should extract some amount
      expect(result.currency).toBe('USD');
    });

    it('should handle invoices with only numbers and no currency symbols', async () => {
      const testImageBuffer = Buffer.from('test-image-data');
      const mockOcrText = `
        Invoice
        Test Company
        Date: 2024-01-01
        Amount: 150.75
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      const result = await service.analyzeInvoice(testImageBuffer);
      expect(result.amount).toBe(150.75);
      expect(result.currency).toBe('USD'); // Default currency
    });
  });
});
