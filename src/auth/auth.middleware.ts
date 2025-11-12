import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service';
import { logger } from '../helpers/Logger';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        logger.warn('Auth middleware: No authorization header provided', {
          path: req.path,
          method: req.method,
        });
        res.status(401).json({
          success: false,
          message: 'Authorization header is required',
        });
        return;
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      if (!token) {
        logger.warn('Auth middleware: No token provided in authorization header', {
          path: req.path,
          method: req.method,
        });
        res.status(401).json({
          success: false,
          message: 'Access token is required',
        });
        return;
      }

      const decoded = await this.authService.verifyAccessToken(token);

      if (!decoded) {
        logger.warn('Auth middleware: Invalid or expired access token', {
          path: req.path,
          method: req.method,
        });
        res.status(401).json({
          success: false,
          message: 'Invalid or expired access token',
        });
        return;
      }

      // Attach user information to request
      req.user = decoded;

      logger.debug('Auth middleware: User authenticated successfully', {
        userId: decoded.userId,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      logger.error('Auth middleware: Error during authentication', {
        error,
        path: req.path,
        method: req.method,
      });
      res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
      });
    }
  };

  // Optional middleware for routes that can work with or without authentication
  optionalAuthenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        // No auth header is fine for optional auth
        next();
        return;
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      if (!token) {
        // No token is fine for optional auth
        next();
        return;
      }

      const decoded = await this.authService.verifyAccessToken(token);

      if (decoded) {
        // Attach user information to request if token is valid
        req.user = decoded;

        logger.debug('Auth middleware: User optionally authenticated', {
          userId: decoded.userId,
          path: req.path,
          method: req.method,
        });
      }

      next();
    } catch (error) {
      logger.error('Auth middleware: Error during optional authentication', {
        error,
        path: req.path,
        method: req.method,
      });
      // For optional auth, we don't fail the request on error
      next();
    }
  };
}

export { AuthRequest };
