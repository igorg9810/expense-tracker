import express, { Express, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import config from './config/index';
import { logger } from './helpers/Logger';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Base routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to ExpenseTracker API' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

// API routes
const apiRouter = Router();

// Example route with parameters
apiRouter.get('/expenses/:id', (req: Request, res: Response) => {
  res.json({
    message: `Fetching expense with ID: ${req.params.id}`,
    data: null,
  });
});

// List expenses route
apiRouter.get('/expenses', (req: Request, res: Response) => {
  res.json({
    message: 'Fetching all expenses',
    data: [],
  });
});

app.use('/api', apiRouter);

// Error handling middleware
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: {
      message: `Not Found - ${req.originalUrl}`,
    },
  });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.stack || err.message);
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      ...(config.isDevelopment && { stack: err.stack }),
    },
  });
});

export const start = async (): Promise<void> => {
  try {
    const server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing server');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing server');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};
