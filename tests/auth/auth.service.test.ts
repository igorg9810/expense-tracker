// Mock the email service module before importing anything
jest.mock('../../src/services/email.service', () => ({
  emailService: {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  },
}));

// Mock other dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/users/users.repository');
jest.mock('../../src/helpers/Logger');

// Mock prisma separately
const createMockPrisma = (): any => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
  resetCode: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
});

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: createMockPrisma(),
}));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/auth/auth.service';
import { UserRepository } from '../../src/users/users.repository';
import { emailService } from '../../src/services/email.service';
import { logger } from '../../src/helpers/Logger';
import { mockUser, mockRefreshToken, mockResetCode } from '../mocks';
import mockPrismaDefault from '../../src/db/prisma';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockUserRepository = new UserRepository(null as any) as jest.Mocked<UserRepository>;
    authService = new AuthService(mockUserRepository);
    mockPrisma = mockPrismaDefault;
    jest.clearAllMocks();

    // Set up environment variable
    process.env.JWT_SECRET = 'test-secret-key-32-characters-long';
  });

  describe('signUp', () => {
    const signUpData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockCreatedUser = { ...mockUser, email: signUpData.email, name: signUpData.name };

      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create = jest.fn().mockResolvedValue(mockCreatedUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      mockPrisma.refreshToken.create = jest.fn().mockResolvedValue(mockRefreshToken);

      const result = await authService.signUp(signUpData);

      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(signUpData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(signUpData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...signUpData,
        password: hashedPassword,
      });
      expect(result.user.email).toBe(signUpData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(true);

      await expect(authService.signUp(signUpData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should handle bcrypt error', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(authService.signUp(signUpData)).rejects.toThrow('Bcrypt error');
    });
  });

  describe('signIn', () => {
    const signInData = {
      email: 'test@example.com',
      password: 'TestPass123',
    };

    it('should sign in user successfully', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      mockPrisma.refreshToken.create = jest.fn().mockResolvedValue(mockRefreshToken);

      const result = await authService.signIn(signInData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(signInData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(signInData.password, mockUser.password);
      expect(result.user.email).toBe(signInData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);

      await expect(authService.signIn(signInData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is invalid', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signIn(signInData)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'valid-refresh-token';

    it('should refresh access token successfully', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser.id, type: 'refresh' });
      mockPrisma.refreshToken.findUnique = jest.fn().mockResolvedValue(mockRefreshToken);
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new-access-token');
      mockPrisma.refreshToken.deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      mockPrisma.refreshToken.create = jest.fn().mockResolvedValue(mockRefreshToken);

      const result = await authService.refreshAccessToken(refreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'ExpenseTracker',
        audience: 'ExpenseTracker-API',
      });
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: refreshToken },
      });
      expect(result).toBeDefined();
      expect(result?.accessToken).toBe('new-access-token');
    });

    it('should return null for invalid refresh token', async () => {
      mockPrisma.refreshToken.findFirst = jest.fn().mockResolvedValue(null);

      const result = await authService.refreshAccessToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired refresh token', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      mockPrisma.refreshToken.findFirst = jest.fn().mockResolvedValue(expiredToken);

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordData = { email: 'test@example.com' };

    it('should send password reset email successfully', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.resetCode.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
      mockPrisma.resetCode.create = jest.fn().mockResolvedValue(mockResetCode);
      (emailService.sendPasswordResetEmail as jest.Mock).mockResolvedValue(true);

      const result = await authService.forgotPassword(forgotPasswordData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(forgotPasswordData.email);
      expect(mockPrisma.resetCode.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.resetCode.create).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return true for non-existent user (prevent email enumeration)', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);

      const result = await authService.forgotPassword(forgotPasswordData);

      expect(result).toBe(true);
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should handle email service failure', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.resetCode.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
      mockPrisma.resetCode.create = jest.fn().mockResolvedValue(mockResetCode);
      (emailService.sendPasswordResetEmail as jest.Mock).mockRejectedValue(
        new Error('Email service error')
      );

      const result = await authService.forgotPassword(forgotPasswordData);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('restorePassword', () => {
    const restorePasswordData = {
      resetCode: 'ABCD1234',
      newPassword: 'NewPass123',
    };

    it('should restore password successfully', async () => {
      const hashedPassword = 'newHashedPassword';
      mockPrisma.resetCode.findUnique = jest.fn().mockResolvedValue({
        ...mockResetCode,
        user: mockUser,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.updatePassword = jest.fn().mockResolvedValue(mockUser);
      mockPrisma.resetCode.deleteMany = jest.fn().mockResolvedValue({ count: 1 });

      const result = await authService.restorePassword(restorePasswordData);

      expect(mockPrisma.resetCode.findUnique).toHaveBeenCalledWith({
        where: { code: restorePasswordData.resetCode },
        include: { user: true },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(restorePasswordData.newPassword, 10);
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(mockUser.id, hashedPassword);
      expect(mockPrisma.resetCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(result).toBe(true);
    });

    it('should return false for invalid reset code', async () => {
      mockPrisma.resetCode.findUnique = jest.fn().mockResolvedValue(null);

      const result = await authService.restorePassword(restorePasswordData);

      expect(result).toBe(false);
    });

    it('should return false for expired reset code', async () => {
      const expiredResetCode = {
        ...mockResetCode,
        expiresAt: new Date(Date.now() - 1000), // Expired
        user: mockUser,
      };
      mockPrisma.resetCode.findUnique = jest.fn().mockResolvedValue(expiredResetCode);

      const result = await authService.restorePassword(restorePasswordData);

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid-refresh-token';

    it('should logout successfully', async () => {
      mockPrisma.refreshToken.deleteMany = jest.fn().mockResolvedValue({ count: 1 });

      const result = await authService.logout(refreshToken);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: refreshToken },
      });
      expect(result).toBe(true);
    });

    it('should return false for invalid refresh token', async () => {
      mockPrisma.refreshToken.deleteMany = jest.fn().mockResolvedValue({ count: 0 });

      const result = await authService.logout('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('logoutAll', () => {
    const userId = 1;

    it('should logout from all devices successfully', async () => {
      mockPrisma.refreshToken.deleteMany = jest.fn().mockResolvedValue({ count: 3 });

      const result = await authService.logoutAll(userId);

      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(result).toBe(true);
    });

    it('should handle database errors', async () => {
      mockPrisma.refreshToken.deleteMany = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await authService.logoutAll(userId);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    const token = 'valid-access-token';
    const decodedToken = { userId: 1, email: 'test@example.com', type: 'access' };

    it('should verify access token successfully', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      const result = await authService.verifyAccessToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'ExpenseTracker',
        audience: 'ExpenseTracker-API',
      });
      expect(result).toEqual({ userId: 1, email: 'test@example.com' });
    });

    it('should return null for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyAccessToken('invalid-token');

      expect(result).toBeNull();
    });
  });
});
