import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../Logger';
import config from '../../config';
import { Prisma } from '@prisma/client';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error handler called', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    errorType: err.constructor.name,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    logger.debug('Handling ZodError');
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors.map((error) => ({
        path: error.path.join('.'),
        message: error.message,
      })),
    });
    return;
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    logger.debug('Handling AppError', { statusCode: err.statusCode });
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(config.isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.debug('Handling PrismaError');
    const prismaError = err as Prisma.PrismaClientKnownRequestError;

    // Handle unique constraint violations
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        status: 'error',
        message: 'A record with this value already exists',
      });
      return;
    }

    // Handle record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        message: 'Record not found',
      });
      return;
    }
  }

  // Handle all other errors
  logger.debug('Handling unknown error');
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.debug('Handling not found request', { path: req.originalUrl });
  res.status(404).json({
    status: 'error',
    message: `Not Found - ${req.originalUrl}`,
  });
};
