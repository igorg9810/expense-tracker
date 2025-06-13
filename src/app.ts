import express, { Express, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import config from './config/index';
import { logger, requestLogger } from './helpers/Logger';
import cors from 'cors';
import { json } from 'body-parser';
import { expensesController } from './expenses/expenses.controller';
import { validateRequest } from './helpers/middlewares/validator';
import { errorHandler, notFoundHandler } from './helpers/middlewares/errorHandler';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
} from './expenses/dto/validation';

const app: Express = express();

// Middleware
app.use(cors());
app.use(json());
app.use(express.urlencoded({ extended: true }));

// Security headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logger middleware
app.use(requestLogger);

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

// Expenses routes with validation
apiRouter.post(
  '/expenses',
  validateRequest({ body: createExpenseSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.createExpense(req, res, next);
  }
);

apiRouter.get(
  '/expenses',
  validateRequest({ query: expenseQuerySchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.getAllExpenses(req, res, next);
  }
);

apiRouter.get(
  '/expenses/:id',
  validateRequest({ params: expenseIdSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.getExpenseById(req, res, next);
  }
);

apiRouter.put(
  '/expenses/:id',
  validateRequest({
    params: expenseIdSchema,
    body: updateExpenseSchema,
  }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.updateExpense(req, res, next);
  }
);

apiRouter.delete(
  '/expenses/:id',
  validateRequest({ params: expenseIdSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.deleteExpense(req, res, next);
  }
);

apiRouter.get(
  '/expenses/stats/category',
  validateRequest({ query: expenseQuerySchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.getExpensesByCategory(req, res, next);
  }
);

app.use('/api', apiRouter);

// Error handling middleware should be last
app.use(notFoundHandler);
app.use(errorHandler);

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

export default app;
