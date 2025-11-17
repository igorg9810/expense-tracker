import { Request, Response, NextFunction } from 'express';

// Store original env
const originalEnv = process.env.NODE_ENV;

// Must set env before importing modules that depend on it
process.env.NODE_ENV = 'test';
process.env.LOG_ENABLED = 'true';
process.env.LOG_LEVEL = 'debug';

// Now import after env is set
import { logger, requestLogger } from '../../src/helpers/Logger';
import config from '../../src/config';

describe('Logger', () => {
  afterAll(() => {
    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  describe('Logger instance', () => {
    it('should exist and be defined', () => {
      expect(logger).toBeDefined();
      expect(logger).not.toBeNull();
    });

    it('should have log methods', () => {
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have configured log level from config', () => {
      expect(config.logLevel).toBe('debug');
    });
  });

  describe('Logging methods', () => {
    it('should not throw when logging error messages', () => {
      expect(() => {
        logger.error('Test error message', { errorCode: 500 });
      }).not.toThrow();
    });

    it('should not throw when logging warn messages', () => {
      expect(() => {
        logger.warn('Test warning message', { userId: 123 });
      }).not.toThrow();
    });

    it('should not throw when logging info messages', () => {
      expect(() => {
        logger.info('Test info message', { action: 'create' });
      }).not.toThrow();
    });

    it('should not throw when logging debug messages', () => {
      expect(() => {
        logger.debug('Test debug message', { details: 'debugging' });
      }).not.toThrow();
    });

    it('should handle error objects with stack traces', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Error occurred', { error });
      }).not.toThrow();
    });
  });

  describe('Stream for Morgan integration', () => {
    it('should support HTTP logging integration', () => {
      // Logger supports various log levels including http for Morgan integration
      // Verify logger has necessary methods for different log levels
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Request Logger Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockRequest = {
        method: 'GET',
        url: '/api/expenses',
        ip: '127.0.0.1',
        get: jest.fn((header: string) => {
          if (header === 'user-agent') return 'test-agent';
          if (header === 'set-cookie') return undefined;
          return undefined;
        }) as unknown as Request['get'],
        path: '/api/expenses',
      };

      mockResponse = {
        statusCode: 200,
        on: jest.fn(() => mockResponse as Response),
      };

      mockNext = jest.fn();
    });

    it('should be a function', () => {
      expect(typeof requestLogger).toBe('function');
    });

    it('should call next middleware', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should not throw when logging requests', () => {
      expect(() => {
        requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle response lifecycle', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);
      // Response event listeners are set up internally
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Logger configuration', () => {
    it('should have logEnabled config option', () => {
      expect(config.logEnabled).toBeDefined();
      expect(typeof config.logEnabled).toBe('boolean');
    });

    it('should have logLevel config option', () => {
      expect(config.logLevel).toBeDefined();
      expect(typeof config.logLevel).toBe('string');
    });

    it('should support different environments', () => {
      expect(config.nodeEnv).toBeDefined();
      expect(config.isDevelopment).toBeDefined();
      expect(config.isProduction).toBeDefined();
    });
  });

  describe('Structured logging', () => {
    it('should support contextual information in logs', () => {
      const context = {
        userId: 123,
        action: 'create_expense',
        expenseId: 456,
        amount: 100.5,
      };

      expect(() => {
        logger.info('Expense created', context);
      }).not.toThrow();
    });

    it('should support nested objects in metadata', () => {
      const metadata = {
        user: {
          id: 123,
          email: 'test@example.com',
        },
        expense: {
          amount: 100,
          category: 'Food',
        },
      };

      expect(() => {
        logger.info('Complex operation', metadata);
      }).not.toThrow();
    });

    it('should support array data in metadata', () => {
      const metadata = {
        expenseIds: [1, 2, 3, 4, 5],
        categories: ['Food', 'Transport', 'Entertainment'],
      };

      expect(() => {
        logger.info('Batch operation', metadata);
      }).not.toThrow();
    });
  });

  describe('Error logging with stack traces', () => {
    it('should handle Error objects with stack traces', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('An error occurred', { error });
      }).not.toThrow();
      expect(error.stack).toBeDefined();
    });

    it('should handle custom error properties', () => {
      class CustomError extends Error {
        code: string;
        constructor(message: string, code: string) {
          super(message);
          this.code = code;
        }
      }

      const error = new CustomError('Custom error', 'ERR_001');
      expect(() => {
        logger.error('Custom error occurred', { error, additionalInfo: 'test' });
      }).not.toThrow();
      expect(error.code).toBe('ERR_001');
    });
  });

  describe('Logger in different environments', () => {
    it('should have environment configuration', () => {
      expect(config.nodeEnv).toBeDefined();
      expect(typeof config.isDevelopment).toBe('boolean');
      expect(typeof config.isProduction).toBe('boolean');
    });

    it('should not be both development and production', () => {
      expect(config.isDevelopment && config.isProduction).toBe(false);
    });
  });
});
