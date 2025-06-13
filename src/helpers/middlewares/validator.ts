import express, { Express, Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler, ValidationError } from './errorHandler';
import { AnyZodObject, ZodError, z, ZodType } from 'zod';
import { logger } from '../Logger';

// Extend Express Request type to include validated query
interface ValidatedRequest<T extends AnyZodObject> extends Request {
  validatedQuery?: z.infer<T>;
}

export const setupMiddleware = (app: Express): void => {
  // Pre-route middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Error handling should be last
  app.use(notFoundHandler);
  app.use(errorHandler);
};

interface ValidationSchema {
  body?: ZodType;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.debug('Starting request validation', {
      path: req.path,
      method: req.method,
      hasBody: !!req.body,
      body: req.body,
      hasQuery: !!req.query,
      hasParams: !!req.params,
    });

    try {
      if (schema.body) {
        logger.debug('Validating request body', { body: req.body });
        const validatedBody = await schema.body.parseAsync(req.body);
        logger.debug('Request body validation successful', { validatedBody });
        req.body = validatedBody;
      }
      if (schema.query) {
        logger.debug('Validating request query');
        const validatedQuery = await schema.query.parseAsync(req.query);
        // Store validated query in a properly typed property
        (req as ValidatedRequest<typeof schema.query>).validatedQuery = validatedQuery;
      }
      if (schema.params) {
        logger.debug('Validating request params');
        req.params = await schema.params.parseAsync(req.params);
      }
      logger.debug('Request validation successful');
      next();
    } catch (error) {
      logger.error('Validation error occurred', {
        error: error instanceof ZodError ? error.errors : error,
        path: req.path,
        method: req.method,
        body: req.body,
      });

      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          JSON.stringify(
            error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            }))
          )
        );
        next(validationError);
        return;
      }
      next(error);
    }
  };
};
