import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { signUpSchema, signInSchema, forgotPasswordSchema, restorePasswordSchema } from './dto';
import { logger } from '../helpers/Logger';
import { AuthRequest } from './auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = signUpSchema.parse(req.body);

      const result = await this.authService.signUp(validatedData);

      logger.info('Auth controller: User signed up successfully', {
        userId: result.user.id,
        email: result.user.email,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User with this email already exists') {
        logger.warn('Auth controller: Sign-up attempt with existing email', {
          error: error.message,
        });
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = signInSchema.parse(req.body);

      const result = await this.authService.signIn(validatedData);

      logger.info('Auth controller: User signed in successfully', {
        userId: result.user.id,
        email: result.user.email,
      });

      res.status(200).json({
        success: true,
        message: 'User signed in successfully',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        logger.warn('Auth controller: Sign-in attempt with invalid credentials');
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      if (!result) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }

      logger.info('Auth controller: Access token refreshed successfully');

      res.status(200).json({
        success: true,
        message: 'Access token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);

      logger.info('Auth controller: Forgot password request received', {
        email: validatedData.email,
      });

      const result = await this.authService.forgotPassword(validatedData);

      if (!result) {
        logger.error('Auth controller: Failed to process forgot password request', {
          email: validatedData.email,
        });
        res.status(500).json({
          success: false,
          message: 'Failed to send password reset email. Please try again.',
        });
        return;
      }

      logger.info('Auth controller: Forgot password request processed successfully', {
        email: validatedData.email,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset instructions have been sent to your email address.',
      });
    } catch (error) {
      logger.error('Auth controller: Error in forgot password request', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  restorePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = restorePasswordSchema.parse(req.body);

      logger.info('Auth controller: Password restore request received', {
        resetCode: validatedData.resetCode,
      });

      const success = await this.authService.restorePassword(validatedData);

      if (!success) {
        logger.warn('Auth controller: Failed to restore password - invalid or expired reset code', {
          resetCode: validatedData.resetCode,
        });
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset code. Please request a new password reset.',
        });
        return;
      }

      logger.info('Auth controller: Password restored successfully', {
        resetCode: validatedData.resetCode,
      });

      res.status(200).json({
        success: true,
        message:
          'Password has been reset successfully. You can now sign in with your new password.',
      });
    } catch (error) {
      logger.error('Auth controller: Error in restore password request', {
        error: error instanceof Error ? error.message : 'Unknown error',
        resetCode: req.body?.resetCode,
      });
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Auth controller: Logout request received');

      // Get refresh token from cookies or body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        logger.warn('Auth controller: Logout attempted without refresh token');
        res.status(400).json({
          success: false,
          message: 'Refresh token is required for logout',
        });
        return;
      }

      const success = await this.authService.logout(refreshToken);

      if (!success) {
        logger.warn('Auth controller: Logout failed - invalid refresh token');
        res.status(400).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      logger.info('Auth controller: User logged out successfully');

      res.status(200).json({
        success: true,
        message: 'Successfully logged out',
      });
    } catch (error) {
      logger.error('Auth controller: Error during logout', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };

  logoutAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Auth controller: Logout all request received');

      // Get user ID from authenticated request
      const userId = req.user?.userId;

      if (!userId) {
        logger.warn('Auth controller: Logout all attempted without authentication');
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const success = await this.authService.logoutAll(userId);

      if (!success) {
        logger.error('Auth controller: Logout all failed');
        res.status(500).json({
          success: false,
          message: 'Failed to logout from all devices',
        });
        return;
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      logger.info('Auth controller: User logged out from all devices successfully', { userId });

      res.status(200).json({
        success: true,
        message: 'Successfully logged out from all devices',
      });
    } catch (error) {
      logger.error('Auth controller: Error during logout all', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  };
}
