import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto, Expense, UpdateExpenseDto } from './dto/types';
import config from '../config';

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

  public createExpense(data: CreateExpenseDto): Expense {
    this.validateExpenseData(data);
    return this.repository.create(data);
  }

  public getExpenseById(id: number): Expense {
    return this.repository.findById(id);
  }

  public getAllExpenses(options?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): { expenses: Expense[]; total: number } {
    const limit = Math.min(
      options?.pageSize || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );
    const offset = options?.page ? (options.page - 1) * limit : 0;

    const expenses = this.repository.findAll({
      ...options,
      limit,
      offset,
    });

    // Get total count for pagination
    const total = this.repository.findAll({
      category: options?.category,
      startDate: options?.startDate,
      endDate: options?.endDate,
    }).length;

    return { expenses, total };
  }

  public updateExpense(id: number, data: UpdateExpenseDto): Expense {
    if (Object.keys(data).length > 0) {
      this.validateExpenseData(data as Partial<CreateExpenseDto>);
    }
    return this.repository.update(id, data);
  }

  public deleteExpense(id: number): void {
    this.repository.delete(id);
  }

  public getExpensesByCategory(
    startDate?: string,
    endDate?: string
  ): Array<{ category: string; total: number }> {
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
