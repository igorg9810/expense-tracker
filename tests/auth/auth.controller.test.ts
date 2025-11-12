import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { logger } from '../../src/helpers/Logger';
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
  mockUser,
  mockTokens,
} from '../mocks';

// Mock dependencies
jest.mock('../../src/auth/auth.service');
jest.mock('../../src/helpers/Logger');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAuthService = new AuthService(null as any) as jest.Mocked<AuthService>;
    authController = new AuthController(mockAuthService);
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const validSignUpData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
    };

    it('should create a new user successfully', async () => {
      const mockResult = {
        user: { ...mockUser, password: undefined },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      };

      mockRequest.body = validSignUpData;
      mockAuthService.signUp = jest.fn().mockResolvedValue(mockResult);

      await authController.signUp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(validSignUpData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: mockResult,
      });
      expect(logger.info).toHaveBeenCalledWith('Auth controller: User signed up successfully', {
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should handle duplicate email error', async () => {
      mockRequest.body = validSignUpData;
      mockAuthService.signUp = jest
        .fn()
        .mockRejectedValue(new Error('User with this email already exists'));

      await authController.signUp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Auth controller: Sign-up attempt with existing email',
        {
          error: 'User with this email already exists',
        }
      );
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { email: 'invalid-email' }; // Invalid data

      await authController.signUp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle general errors', async () => {
      mockRequest.body = validSignUpData;
      const error = new Error('Database error');
      mockAuthService.signUp = jest.fn().mockRejectedValue(error);

      await authController.signUp(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('signIn', () => {
    const validSignInData = {
      email: 'test@example.com',
      password: 'TestPass123',
    };

    it('should sign in user successfully', async () => {
      const mockResult = {
        user: { ...mockUser, password: undefined },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      };

      mockRequest.body = validSignInData;
      mockAuthService.signIn = jest.fn().mockResolvedValue(mockResult);

      await authController.signIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(validSignInData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User signed in successfully',
        data: mockResult,
      });
      expect(logger.info).toHaveBeenCalledWith('Auth controller: User signed in successfully', {
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should handle invalid credentials', async () => {
      mockRequest.body = validSignInData;
      mockAuthService.signIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));

      await authController.signIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Auth controller: Sign-in attempt with invalid credentials'
      );
    });

    it('should handle general errors', async () => {
      mockRequest.body = validSignInData;
      const error = new Error('Database error');
      mockAuthService.signIn = jest.fn().mockRejectedValue(error);

      await authController.signIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResult = {
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      };

      mockRequest.body = { refreshToken: mockTokens.refreshToken };
      mockAuthService.refreshAccessToken = jest.fn().mockResolvedValue(mockResult);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Access token refreshed successfully',
        data: mockResult,
      });
    });

    it('should handle missing refresh token', async () => {
      mockRequest.body = {};

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required',
      });
    });

    it('should handle invalid refresh token', async () => {
      mockRequest.body = { refreshToken: 'invalid-token' };
      mockAuthService.refreshAccessToken = jest.fn().mockResolvedValue(null);

      await authController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
      });
    });
  });

  describe('forgotPassword', () => {
    const validEmailData = { email: 'test@example.com' };

    it('should process forgot password request successfully', async () => {
      mockRequest.body = validEmailData;
      mockAuthService.forgotPassword = jest.fn().mockResolvedValue(true);

      await authController.forgotPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(validEmailData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset instructions have been sent to your email address.',
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Auth controller: Forgot password request processed successfully',
        { email: validEmailData.email }
      );
    });

    it('should handle failed password reset', async () => {
      mockRequest.body = validEmailData;
      mockAuthService.forgotPassword = jest.fn().mockResolvedValue(false);

      await authController.forgotPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to send password reset email. Please try again.',
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { email: 'invalid-email' };

      await authController.forgotPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('restorePassword', () => {
    const validRestoreData = {
      resetCode: 'ABC123',
      newPassword: 'NewPass123',
    };

    it('should restore password successfully', async () => {
      mockRequest.body = validRestoreData;
      mockAuthService.restorePassword = jest.fn().mockResolvedValue(true);

      await authController.restorePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.restorePassword).toHaveBeenCalledWith(validRestoreData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message:
          'Password has been reset successfully. You can now sign in with your new password.',
      });
    });

    it('should handle invalid reset code', async () => {
      mockRequest.body = validRestoreData;
      mockAuthService.restorePassword = jest.fn().mockResolvedValue(false);

      await authController.restorePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired reset code. Please request a new password reset.',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully with refresh token from cookies', async () => {
      mockRequest.cookies = { refreshToken: mockTokens.refreshToken };
      mockAuthService.logout = jest.fn().mockResolvedValue(true);

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out',
      });
    });

    it('should logout successfully with refresh token from body', async () => {
      mockRequest.body = { refreshToken: mockTokens.refreshToken };
      mockAuthService.logout = jest.fn().mockResolvedValue(true);

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockTokens.refreshToken);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing refresh token', async () => {
      mockRequest.body = {};
      mockRequest.cookies = {};

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required for logout',
      });
    });

    it('should handle failed logout', async () => {
      mockRequest.body = { refreshToken: mockTokens.refreshToken };
      mockAuthService.logout = jest.fn().mockResolvedValue(false);

      await authController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
      });
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      const authRequest = {
        ...mockRequest,
        user: { userId: mockUser.id, email: mockUser.email },
      } as any;
      mockAuthService.logoutAll = jest.fn().mockResolvedValue(true);

      await authController.logoutAll(authRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully logged out from all devices',
      });
    });

    it('should handle missing user in request', async () => {
      await authController.logoutAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });
  });
});
