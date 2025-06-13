/* eslint-disable no-console */
import winston from 'winston';
import config from '../config';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`;
  }

  // Add stack trace if present
  if (stack) {
    msg += `\n${stack}`;
  }

  return msg;
});

// Custom format for file output
const fileFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  const logEntry: Record<string, unknown> = {
    timestamp,
    level,
    message,
    ...metadata,
  };

  if (stack) {
    logEntry.stack = stack;
  }

  return JSON.stringify(logEntry);
});

// Determine log level based on environment
const level = (): string => {
  const env = config.nodeEnv || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    config.isProduction ? json() : consoleFormat
  ),
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // File transport for production
    ...(config.isProduction
      ? [
          // Error logs
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            format: combine(timestamp(), fileFormat),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true,
          }),
          // Combined logs
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            format: combine(timestamp(), fileFormat),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true,
          }),
        ]
      : []),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'exceptions.log'),
      format: combine(timestamp(), fileFormat),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
      format: combine(timestamp(), fileFormat),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Create a stream object for Morgan integration
export const stream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Add request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log the request when it starts
  logger.debug('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log the response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

// Export the logger instance
export { logger };
