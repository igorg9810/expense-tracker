import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './errorHandler';

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
