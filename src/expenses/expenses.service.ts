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

  public async createExpense(data: CreateExpenseDto): Promise<Expense> {
    this.validateExpenseData(data);
    return this.repository.create(data);
  }

  public async getExpenseById(id: number): Promise<Expense> {
    return this.repository.findById(id);
  }

  public async getAllExpenses(options?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ expenses: Expense[]; total: number }> {
    const limit = Math.min(
      options?.pageSize || config.pagination.defaultPageSize,
      config.pagination.maxPageSize
    );
    const offset = options?.page ? (options.page - 1) * limit : 0;

    const [expenses, totalExpenses] = await Promise.all([
      this.repository.findAll({
        ...options,
        limit,
        offset,
      }),
      this.repository.findAll({
        category: options?.category,
        startDate: options?.startDate,
        endDate: options?.endDate,
      }),
    ]);

    return { expenses, total: totalExpenses.length };
  }

  public async updateExpense(id: number, data: UpdateExpenseDto): Promise<Expense> {
    if (Object.keys(data).length > 0) {
      this.validateExpenseData(data as Partial<CreateExpenseDto>);
    }
    return this.repository.update(id, data);
  }

  public async deleteExpense(id: number): Promise<void> {
    await this.repository.delete(id);
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
