import { Response, NextFunction } from 'express';
import { AuthMiddleware, AuthRequest } from '../../src/auth/auth.middleware';
import { AuthService } from '../../src/auth/auth.service';
import { logger } from '../../src/helpers/Logger';
import { createMockRequest, createMockResponse, createMockNext } from '../mocks';

// Mock dependencies
jest.mock('../../src/auth/auth.service');
jest.mock('../../src/helpers/Logger');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAuthService = new AuthService(null as any) as jest.Mocked<AuthService>;
    authMiddleware = new AuthMiddleware(mockAuthService);
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockDecodedToken = { userId: 1, email: 'test@example.com' };
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
        path: '/api/test',
        method: 'GET',
      });

      mockAuthService.verifyAccessToken = jest.fn().mockResolvedValue(mockDecodedToken);

      await authMiddleware.authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Auth middleware: User authenticated successfully',
        {
          userId: mockDecodedToken.userId,
          path: '/api/test',
          method: 'GET',
        }
      );
    });

    it('should handle missing authorization header', async () => {
      mockRequest = createMockRequest({
        headers: {},
        path: '/api/test',
        method: 'GET',
      });

      await authMiddleware.authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization header is required',
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Auth middleware: No authorization header provided',
        {
          path: '/api/test',
          method: 'GET',
        }
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing token in authorization header', async () => {
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer ' },
        path: '/api/test',
        method: 'GET',
      });

      await authMiddleware.authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Auth middleware: No token provided in authorization header',
        {
          path: '/api/test',
          method: 'GET',
        }
      );
    });

    it('should handle invalid token', async () => {
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer invalid-token' },
        path: '/api/test',
        method: 'GET',
      });

      mockAuthService.verifyAccessToken = jest.fn().mockResolvedValue(null);

      await authMiddleware.authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired access token',
      });
      expect(logger.warn).toHaveBeenCalledWith('Auth middleware: Invalid or expired access token', {
        path: '/api/test',
        method: 'GET',
      });
    });

    it('should handle token without Bearer prefix', async () => {
      const mockDecodedToken = { userId: 1, email: 'test@example.com' };
      mockRequest = createMockRequest({
        headers: { authorization: 'direct-token' },
      });

      mockAuthService.verifyAccessToken = jest.fn().mockResolvedValue(mockDecodedToken);

      await authMiddleware.authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('direct-token');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle authentication service errors', async () => {
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
        path: '/api/test',
        method: 'GET',
      });

      mockAuthService.verifyAccessToken = jest.fn().mockRejectedValue(new Error('Service error'));

      await authMiddleware.authenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error during authentication',
      });
      expect(logger.error).toHaveBeenCalledWith('Auth middleware: Error during authentication', {
        error: expect.any(Error),
        path: '/api/test',
        method: 'GET',
      });
    });
  });

  describe('optionalAuthenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockDecodedToken = { userId: 1, email: 'test@example.com' };
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
        path: '/api/test',
        method: 'GET',
      });

      mockAuthService.verifyAccessToken = jest.fn().mockResolvedValue(mockDecodedToken);

      await authMiddleware.optionalAuthenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockDecodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Auth middleware: User optionally authenticated', {
        userId: mockDecodedToken.userId,
        path: '/api/test',
        method: 'GET',
      });
    });

    it('should continue without authentication when no header provided', async () => {
      mockRequest = createMockRequest({ headers: {} });

      await authMiddleware.optionalAuthenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when no token provided', async () => {
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer ' },
      });

      await authMiddleware.optionalAuthenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer invalid-token' },
      });

      mockAuthService.verifyAccessToken = jest.fn().mockResolvedValue(null);

      await authMiddleware.optionalAuthenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockRequest = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
        path: '/api/test',
        method: 'GET',
      });

      mockAuthService.verifyAccessToken = jest.fn().mockRejectedValue(new Error('Service error'));

      await authMiddleware.optionalAuthenticate(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Auth middleware: Error during optional authentication',
        {
          error: expect.any(Error),
          path: '/api/test',
          method: 'GET',
        }
      );
    });
  });
});
