import { Request, Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/types';
import { BadRequestError, NotFoundError } from '../helpers/middlewares/errorHandler';
import { logger } from '../helpers/Logger';

export class ExpensesController {
  private static instance: ExpensesController;

  private constructor() {}

  public static getInstance(): ExpensesController {
    if (!ExpensesController.instance) {
      ExpensesController.instance = new ExpensesController();
    }
    return ExpensesController.instance;
  }

  public async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expenseData: CreateExpenseDto = req.body;
      const expense = await expensesService.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  public async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  public async getAllExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, startDate, endDate, limit, offset } = req.query;

      const result = await expensesService.getAllExpenses({
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
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

  public async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  public async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  public async getExpensesByCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const totals = await expensesService.getExpensesByCategory(
        startDate as string,
        endDate as string
      );
      res.json(totals);
    } catch (error) {
      next(error);
    }
  }
}

export const expensesController = ExpensesController.getInstance();
