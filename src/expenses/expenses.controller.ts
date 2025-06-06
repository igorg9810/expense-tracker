import { Request, Response } from 'express';
import { expensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/types';

export class ExpensesController {
  private static instance: ExpensesController;

  private constructor() {}

  public static getInstance(): ExpensesController {
    if (!ExpensesController.instance) {
      ExpensesController.instance = new ExpensesController();
    }
    return ExpensesController.instance;
  }

  public async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const expenseData: CreateExpenseDto = req.body;

      // Validate required fields
      if (
        !expenseData.name ||
        !expenseData.amount ||
        !expenseData.currency ||
        !expenseData.category
      ) {
        res.status(400).json({
          error: 'Missing required fields: name, amount, currency, and category are required',
        });
        return;
      }

      const expense = expensesService.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to create expense',
      });
    }
  }

  public async getExpenseById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const expense = expensesService.getExpenseById(id);
      res.json(expense);
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : 'Expense not found',
      });
    }
  }

  public async getAllExpenses(req: Request, res: Response): Promise<void> {
    try {
      const { category, startDate, endDate, page, pageSize } = req.query;

      const result = expensesService.getAllExpenses({
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.json({
        data: result.expenses,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string) : 1,
          pageSize: pageSize ? parseInt(pageSize as string) : 10,
          totalPages: Math.ceil(result.total / (pageSize ? parseInt(pageSize as string) : 10)),
        },
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to fetch expenses',
      });
    }
  }

  public async updateExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const updateData: UpdateExpenseDto = { id, ...req.body };
      const expense = expensesService.updateExpense(id, updateData);
      res.json(expense);
    } catch (error) {
      res
        .status(error instanceof Error && error.message.includes('not found') ? 404 : 400)
        .json({ error: error instanceof Error ? error.message : 'Failed to update expense' });
    }
  }

  public async deleteExpense(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      expensesService.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      res
        .status(error instanceof Error && error.message.includes('not found') ? 404 : 400)
        .json({ error: error instanceof Error ? error.message : 'Failed to delete expense' });
    }
  }

  public async getExpensesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const totals = expensesService.getExpensesByCategory(startDate as string, endDate as string);
      res.json(totals);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to fetch category totals',
      });
    }
  }
}

export const expensesController = ExpensesController.getInstance();
