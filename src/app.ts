import express, { Express, Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import config from './config/index';
import { logger, requestLogger } from './helpers/Logger';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { json } from 'body-parser';
import compression from 'compression';
import { expensesController } from './expenses/expenses.controller';
import { authUserRoutes, authMiddleware } from './routes/authUser.routes';
import {
  invoiceAnalysisController,
  uploadMiddleware,
} from './invoices/invoice-analysis.controller';
import { validateRequest } from './helpers/middlewares/validator';
import { AuthRequest } from './auth/auth.middleware';
import { errorHandler, notFoundHandler } from './helpers/middlewares/errorHandler';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
  reorderExpensesSchema,
} from './expenses/dto/validation';
import { SchedulerService } from './services/scheduler.service';
import {
  securityHeaders,
  validateContentType,
  limitRequestSize,
} from './helpers/middlewares/security';

const app: Express = express();

// Response compression middleware (should be early in the chain)
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9, 6 is default balance)
  })
);

// Additional security headers middleware
app.use(securityHeaders);

// Security middleware - helmet with custom configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow for development
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS with secure configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || false
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'null'], // Allow local development and file:// origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours
  })
);

// Content-Type validation middleware
app.use(validateContentType);

// Request size limiting middleware
app.use(limitRequestSize('1mb'));

// Body parsing middleware
app.use(json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logger middleware
app.use(requestLogger);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for general endpoints
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Static file serving for test files
app.use(
  express.static('.', {
    index: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    },
  })
);

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

// Auth and User routes (includes both public and protected routes)
apiRouter.use(authUserRoutes);

// Expenses routes with validation and authentication
apiRouter.post(
  '/expenses',
  authMiddleware.authenticate,
  validateRequest({ body: createExpenseSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.createExpense(req, res, next);
  }
);

apiRouter.get(
  '/expenses',
  authMiddleware.authenticate,
  validateRequest({ query: expenseQuerySchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.getAllExpenses(req, res, next);
  }
);

apiRouter.get(
  '/expenses/:id',
  authMiddleware.authenticate,
  validateRequest({ params: expenseIdSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.getExpenseById(req, res, next);
  }
);

apiRouter.patch(
  '/expenses/:id',
  authMiddleware.authenticate,
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
  authMiddleware.authenticate,
  validateRequest({ params: expenseIdSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.deleteExpense(req, res, next);
  }
);

apiRouter.get(
  '/expenses/stats/category',
  authMiddleware.authenticate,
  validateRequest({ query: expenseQuerySchema }),
  (req: Request, res: Response, next: NextFunction) => {
    expensesController.getExpensesByCategory(req, res, next);
  }
);

apiRouter.patch(
  '/expenses/reorder',
  authMiddleware.authenticate,
  validateRequest({ body: reorderExpensesSchema }),
  (req: Request, res: Response, next: NextFunction) => {
    // Cast validated request to AuthRequest for controller
    expensesController.reorderExpenses(req as AuthRequest, res, next);
  }
);

// Invoice analysis routes
apiRouter.post(
  '/invoices/analyze',
  authMiddleware.authenticate,
  uploadMiddleware.single('invoice'),
  (req: Request, res: Response, next: NextFunction) => {
    invoiceAnalysisController.analyzeInvoice(req, res, next);
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

    // Initialize scheduled jobs
    SchedulerService.initialize();

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
