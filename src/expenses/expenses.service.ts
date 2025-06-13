import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto, Expense } from './dto/types';
import { logger } from '../helpers/Logger';

interface GetAllExpensesOptions {
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface GetAllExpensesResult {
  expenses: Expense[];
  total: number;
}

export class ExpensesService {
  private static instance: ExpensesService;
  private repository: ExpensesRepository;

  private constructor() {
    this.repository = ExpensesRepository.getInstance();
  }

  public static getInstance(): ExpensesService {
    if (!ExpensesService.instance) {
      ExpensesService.instance = new ExpensesService();
    }
    return ExpensesService.instance;
  }

  public async createExpense(expenseData: CreateExpenseDto): Promise<Expense> {
    this.validateExpenseData(expenseData);
    return this.repository.create(expenseData);
  }

  public async getExpenseById(id: number): Promise<Expense | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      return null;
    }
  }

  public async getAllExpenses(options: GetAllExpensesOptions): Promise<GetAllExpensesResult> {
    const expenses = await this.repository.findAll(options);
    const total = expenses.length; // In a real app, you'd get this from the database
    return { expenses, total };
  }

  public async updateExpense(
    id: number,
    updateData: Partial<CreateExpenseDto>
  ): Promise<Expense | null> {
    try {
      // Remove undefined values from updateData
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      ) as Partial<CreateExpenseDto>;

      if (Object.keys(cleanUpdateData).length === 0) {
        throw new Error('No update data provided');
      }

      this.validateExpenseData(cleanUpdateData);
      return await this.repository.update(id, cleanUpdateData);
    } catch (error) {
      logger.error('Error updating expense:', { error, id, updateData });
      throw error; // Re-throw to be handled by the controller
    }
  }

  public async deleteExpense(id: number): Promise<boolean> {
    try {
      await this.repository.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async getExpensesByCategory(
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ category: string; total: number }>> {
    return this.repository.getTotalByCategory(startDate, endDate);
  }

  private validateExpenseData(data: Partial<CreateExpenseDto>): void {
    if (data.amount !== undefined && (isNaN(data.amount) || data.amount <= 0)) {
      throw new Error('Amount must be a positive number');
    }

    if (data.currency && !/^[A-Z]{3}$/.test(data.currency)) {
      throw new Error('Currency must be a valid 3-letter code (e.g., USD, EUR)');
    }

    if (data.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
      if (!dateRegex.test(data.date)) {
        throw new Error('Date must be in YYYY-MM-DD or ISO 8601 format');
      }
    }
  }
}

export const expensesService = ExpensesService.getInstance();
