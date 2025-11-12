import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../users/users.repository';
import {
  SignUpInput,
  SignInInput,
  AuthResponse,
  ForgotPasswordInput,
  RestorePasswordInput,
} from './dto';
import { logger } from '../helpers/Logger';
import { emailService } from '../services/email.service';
import prisma from '../db/prisma';

export class AuthService {
  private userRepository: UserRepository;
  private readonly saltRounds = 10;
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

    // Ensure JWT secret is secure enough
    if (!process.env.JWT_SECRET) {
      logger.warn(
        'JWT_SECRET not set in environment variables, using default (not recommended for production)'
      );
    } else if (process.env.JWT_SECRET.length < 32) {
      logger.warn('JWT_SECRET should be at least 32 characters long for security');
    }
  }

  async signUp(userData: SignUpInput): Promise<AuthResponse> {
    try {
      logger.info('Auth service: Starting user sign-up', { email: userData.email });

      // Check if user already exists
      const existingUser = await this.userRepository.existsByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);

      // Create user
      const user = await this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.email);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in database
      await this.storeRefreshToken(user.id, refreshToken);

      logger.info('Auth service: User signed up successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Auth service: Error during sign-up', { error, email: userData.email });
      throw error;
    }
  }

  async signIn(credentials: SignInInput): Promise<AuthResponse> {
    try {
      logger.info('Auth service: Starting user sign-in', { email: credentials.email });

      // Find user by email
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        logger.warn('Auth service: Sign-in attempt with non-existent email', {
          email: credentials.email,
        });
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        logger.warn('Auth service: Sign-in attempt with invalid password', {
          email: credentials.email,
        });
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.email);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in database
      await this.storeRefreshToken(user.id, refreshToken);

      logger.info('Auth service: User signed in successfully', { userId: user.id });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Auth service: Error during sign-in', { error, email: credentials.email });
      throw error;
    }
  }

  async verifyAccessToken(token: string): Promise<{ userId: number; email: string } | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'], // Only allow specific algorithm
        issuer: 'ExpenseTracker',
        audience: 'ExpenseTracker-API',
      }) as { userId: number; email: string; type: string };

      // Verify token type
      if (decoded.type !== 'access') {
        logger.warn('Auth service: Invalid token type for access token verification');
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Auth service: Invalid access token provided', { error: errorMessage });
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<{ userId: number } | null> {
    try {
      // First verify JWT signature and expiration
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'], // Only allow specific algorithm
        issuer: 'ExpenseTracker',
        audience: 'ExpenseTracker-API',
      }) as { userId: number; type: string };

      // Verify token type
      if (decoded.type !== 'refresh') {
        logger.warn('Auth service: Invalid token type for refresh token verification');
        return null;
      }

      // Then check if token exists in database and is not expired
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken) {
        logger.warn('Auth service: Refresh token not found in database');
        return null;
      }

      if (new Date() > storedToken.expiresAt) {
        logger.warn('Auth service: Refresh token expired in database');
        // Clean up expired token
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        return null;
      }

      return {
        userId: decoded.userId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Auth service: Invalid refresh token provided', { error: errorMessage });
      return null;
    }
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const decoded = await this.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return null;
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        return null;
      }

      // Generate new tokens
      const accessToken = this.generateAccessToken(user.id, user.email);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Remove old refresh token and store new one (refresh token rotation)
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      await this.storeRefreshToken(user.id, newRefreshToken);

      logger.info('Auth service: Access token refreshed successfully', { userId: user.id });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Auth service: Error refreshing access token', { error });
      return null;
    }
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<boolean> {
    try {
      logger.info('Auth service: Starting forgot password process', { email: input.email });

      // Check if user exists
      const user = await this.userRepository.findByEmail(input.email);
      if (!user) {
        logger.warn('Auth service: Forgot password attempt for non-existent email', {
          email: input.email,
        });
        // Return true to prevent email enumeration attacks
        return true;
      }

      // Generate reset code
      const resetCode = this.generateResetCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expires in 10 minutes

      // Save reset code to database
      await this.createResetCode(user.id, resetCode, expiresAt);

      // Send password reset email
      const emailSent = await emailService.sendPasswordResetEmail({
        email: user.email,
        resetCode,
        userName: user.name,
      });

      if (!emailSent) {
        logger.error('Auth service: Failed to send password reset email', {
          email: user.email,
        });
        return false;
      }

      logger.info('Auth service: Password reset email sent successfully', {
        userId: user.id,
        email: user.email,
      });

      return true;
    } catch (error) {
      logger.error('Auth service: Error in forgot password process', {
        error,
        email: input.email,
      });
      return false;
    }
  }

  async validateResetCode(code: string): Promise<{ userId: number; email: string } | null> {
    try {
      logger.info('Auth service: Validating reset code');

      // Find reset code in database
      const resetCodeRecord = await prisma.resetCode.findUnique({
        where: { code },
        include: { user: true },
      });

      if (!resetCodeRecord) {
        logger.warn('Auth service: Invalid reset code provided');
        return null;
      }

      // Check if code has expired
      if (new Date() > resetCodeRecord.expiresAt) {
        logger.warn('Auth service: Expired reset code provided', {
          codeId: resetCodeRecord.id,
        });
        // Clean up expired code
        await this.deleteResetCode(resetCodeRecord.id);
        return null;
      }

      logger.info('Auth service: Reset code validated successfully', {
        userId: resetCodeRecord.user.id,
      });

      return {
        userId: resetCodeRecord.user.id,
        email: resetCodeRecord.user.email,
      };
    } catch (error) {
      logger.error('Auth service: Error validating reset code', { error });
      return null;
    }
  }

  async restorePassword(input: RestorePasswordInput): Promise<boolean> {
    try {
      logger.info('Auth service: Starting password restore process', {
        resetCode: input.resetCode,
      });

      // Validate reset code and get user information
      const resetInfo = await this.validateResetCode(input.resetCode);
      if (!resetInfo) {
        logger.warn('Auth service: Invalid or expired reset code provided for restore password');
        return false;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(input.newPassword, this.saltRounds);

      // Update user password
      await this.userRepository.updatePassword(resetInfo.userId, hashedPassword);

      // Remove the reset code after successful password update
      await prisma.resetCode.deleteMany({
        where: { userId: resetInfo.userId },
      });

      logger.info('Auth service: Password restored successfully', {
        userId: resetInfo.userId,
        email: resetInfo.email,
      });

      return true;
    } catch (error) {
      logger.error('Auth service: Error in restore password process', {
        error,
        resetCode: input.resetCode,
      });
      return false;
    }
  }

  private async createResetCode(userId: number, code: string, expiresAt: Date): Promise<void> {
    try {
      // Remove any existing reset codes for this user
      await prisma.resetCode.deleteMany({
        where: { userId },
      });

      // Create new reset code
      await prisma.resetCode.create({
        data: {
          code,
          userId,
          expiresAt,
        },
      });

      logger.info('Auth service: Reset code created successfully', { userId });
    } catch (error) {
      logger.error('Auth service: Error creating reset code', { error, userId });
      throw error;
    }
  }

  private async deleteResetCode(id: number): Promise<void> {
    try {
      await prisma.resetCode.delete({
        where: { id },
      });
      logger.info('Auth service: Reset code deleted successfully', { id });
    } catch (error) {
      logger.error('Auth service: Error deleting reset code', { error, id });
      throw error;
    }
  }

  private generateResetCode(): string {
    // Generate a 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateAccessToken(userId: number, email: string): string {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        userId,
        email,
        type: 'access',
        iat: now, // Issued at
        jti: `${userId}-${now}`, // JWT ID for uniqueness
      },
      this.jwtSecret,
      {
        expiresIn: this.accessTokenExpiry,
        algorithm: 'HS256', // Explicit algorithm
        issuer: 'ExpenseTracker',
        audience: 'ExpenseTracker-API',
      }
    );
  }

  private generateRefreshToken(userId: number): string {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        userId,
        type: 'refresh',
        iat: now, // Issued at
        jti: `${userId}-refresh-${now}`, // JWT ID for uniqueness
      },
      this.jwtSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        algorithm: 'HS256', // Explicit algorithm
        issuer: 'ExpenseTracker',
        audience: 'ExpenseTracker-API',
      }
    );
  }

  private async storeRefreshToken(userId: number, token: string): Promise<void> {
    try {
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt,
        },
      });

      logger.info('Auth service: Refresh token stored successfully', { userId });
    } catch (error) {
      logger.error('Auth service: Error storing refresh token', { error, userId });
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    try {
      logger.info('Auth service: Starting logout process');

      // Remove the specific refresh token from database
      const result = await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });

      if (result.count === 0) {
        logger.warn('Auth service: Logout attempted with invalid refresh token');
        return false;
      }

      logger.info('Auth service: User logged out successfully', { tokensRemoved: result.count });
      return true;
    } catch (error) {
      logger.error('Auth service: Error during logout', { error });
      return false;
    }
  }

  async logoutAll(userId: number): Promise<boolean> {
    try {
      logger.info('Auth service: Starting logout all process', { userId });

      // Remove all refresh tokens for this user
      const result = await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      logger.info('Auth service: User logged out from all devices successfully', {
        userId,
        tokensRemoved: result.count,
      });
      return true;
    } catch (error) {
      logger.error('Auth service: Error during logout all', { error, userId });
      return false;
    }
  }
}
