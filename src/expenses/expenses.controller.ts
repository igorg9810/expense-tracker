import { Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/types';
import { BadRequestError, NotFoundError } from '../helpers/middlewares/errorHandler';
import { logger } from '../helpers/Logger';
import { AuthRequest } from '../auth/auth.middleware';

export class ExpensesController {
  private static instance: ExpensesController;

  private constructor() {}

  public static getInstance(): ExpensesController {
    if (!ExpensesController.instance) {
      ExpensesController.instance = new ExpensesController();
    }
    return ExpensesController.instance;
  }

  public async createExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const expenseData: CreateExpenseDto = {
        ...req.body,
        userId: req.user!.userId, // Get userId from authenticated user
      };
      const expense = await expensesService.createExpense(expenseData);
      logger.info('Expense created successfully', { expenseId: expense.id });
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  public async getExpenseById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        next(new BadRequestError('Invalid ID format'));
        return;
      }

      const expense = await expensesService.getExpenseById(id);
      if (!expense) {
        next(new NotFoundError(`Expense with id ${id} not found`));
        return;
      }

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  public async getAllExpenses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, fromDate, toDate, limit, offset } = req.query;

      const result = await expensesService.getAllExpenses({
        userId: req.user!.userId, // Filter by authenticated user
        category: category as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json({
        data: result.expenses,
        pagination: {
          total: result.total,
          limit: limit ? parseInt(limit as string) : 10,
          offset: offset ? parseInt(offset as string) : 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        next(new BadRequestError('Invalid ID format'));
        return;
      }

      logger.debug('Update request body:', { body: req.body });
      const updateData: UpdateExpenseDto = req.body;

      if (!updateData || Object.keys(updateData).length === 0) {
        next(new BadRequestError('Update data is required'));
        return;
      }

      const expense = await expensesService.updateExpense(id, updateData);
      if (!expense) {
        next(new NotFoundError(`Expense with id ${id} not found`));
        return;
      }

      logger.info(`Expense with id ${id} updated successfully`);
      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  public async deleteExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        next(new BadRequestError('Invalid ID format'));
        return;
      }

      const deleted = await expensesService.deleteExpense(id);
      if (!deleted) {
        next(new NotFoundError(`Expense with id ${id} not found`));
        return;
      }

      logger.info(`Expense with id ${id} deleted successfully`);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  public async getExpensesByCategory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fromDate, toDate } = req.query;
      const totals = await expensesService.getExpensesByCategory(
        req.user!.userId, // Filter by authenticated user
        fromDate as string,
        toDate as string
      );
      res.json(totals);
    } catch (error) {
      next(error);
    }
  }
}

export const expensesController = ExpensesController.getInstance();
