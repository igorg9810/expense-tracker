import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  dbPath: string;
  logLevel: string;
  cors: {
    origin: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'data', 'expense-tracker.db'),
  logLevel: process.env.LOG_LEVEL || 'info',
  cors: {
    origin: (process.env.CORS_ORIGIN || '*').split(',').map((origin) => origin.trim()),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
};

export default config;
