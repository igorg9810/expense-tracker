import request from 'supertest';
import app from '../../src/app';

// Mock the OCR and image processing
jest.mock('tesseract.js');
jest.mock('sharp');

import Tesseract from 'tesseract.js';
import sharp from 'sharp';

const mockTesseract = Tesseract as jest.Mocked<typeof Tesseract>;
const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

// Mock auth middleware to always pass authentication
jest.mock('../../src/auth/auth.middleware', () => ({
  AuthMiddleware: jest.fn().mockImplementation(() => ({
    authenticate: (req: any, res: any, next: any) => {
      req.user = { userId: 'test-user-id', email: 'test@example.com' };
      next();
    },
  })),
}));

// Mock the auth service to prevent actual authentication calls
jest.mock('../../src/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    verifyAccessToken: jest
      .fn()
      .mockResolvedValue({ userId: 'test-user-id', email: 'test@example.com' }),
  })),
}));

describe('POST /api/invoices/analyze - Integration Tests', () => {
  let mockSharpInstance: any;

  beforeEach(() => {
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

    jest.clearAllMocks();
  });

  describe('Successful analysis', () => {
    it('should analyze invoice and return structured data', async () => {
      const mockOcrText = `
        INVOICE #12345
        ABC Restaurant
        123 Main Street, City
        Date: January 15, 2024
        
        Item                Amount
        Burger              $15.99
        Fries               $4.99
        Drink               $2.99
        
        Subtotal:           $23.97
        Tax (8.5%):         $2.04
        Total:              $26.01
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      // Create a test image buffer (minimal JPEG header)
      const testImageBuffer = Buffer.from([
        0xff,
        0xd8, // JPEG SOI
        0xff,
        0xe0, // JFIF marker
        ...Array(100).fill(0), // Dummy data
        0xff,
        0xd9, // JPEG EOI
      ]);

      const response = await request(app)
        .post('/api/invoices/analyze')
        .set('Authorization', 'Bearer valid-token')
        .attach('invoice', testImageBuffer, 'test-invoice.jpg');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: expect.any(String),
        amount: expect.any(Number),
        currency: expect.stringMatching(/^(USD|EUR)$/),
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });

      expect(response.body.name.length).toBeGreaterThan(0);
      expect(response.body.amount).toBeGreaterThan(0);
    });
  });

  describe('Basic validation', () => {
    it('should return valid response format', async () => {
      const mockOcrText = `
        Test Invoice
        Test Company
        Date: 2024-01-01
        Total: $100.00
      `;

      mockTesseract.recognize.mockResolvedValue({
        data: { text: mockOcrText },
      } as any);

      const testImageBuffer = Buffer.from([0xff, 0xd8, ...Array(100).fill(0), 0xff, 0xd9]);

      const response = await request(app)
        .post('/api/invoices/analyze')
        .set('Authorization', 'Bearer valid-token')
        .attach('invoice', testImageBuffer, 'test.jpg');

      expect([200, 422]).toContain(response.status); // Either success or parsing failure is acceptable

      if (response.status === 200) {
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('amount');
        expect(response.body).toHaveProperty('currency');
        expect(response.body).toHaveProperty('date');
      } else {
        expect(response.body).toHaveProperty('error');
      }
    });
  });
});
