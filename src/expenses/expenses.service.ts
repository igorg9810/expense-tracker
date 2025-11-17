import { ExpensesRepository } from './expenses.repository';
import { CreateExpenseDto, Expense } from './dto/types';
import { logger } from '../helpers/Logger';
import { CacheService, cacheService } from '../services/cache.service';

interface GetAllExpensesOptions {
  userId?: number;
  category?: string;
  fromDate?: string;
  toDate?: string;
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
  private cache: CacheService;

  private constructor() {
    this.repository = ExpensesRepository.getInstance();
    this.cache = cacheService;
  }

  public static getInstance(): ExpensesService {
    if (!ExpensesService.instance) {
      ExpensesService.instance = new ExpensesService();
    }
    return ExpensesService.instance;
  }

  public async createExpense(expenseData: CreateExpenseDto): Promise<Expense> {
    this.validateExpenseData(expenseData);
    const expense = await this.repository.create(expenseData);

    // Invalidate user's cache after creating expense
    CacheService.invalidateUserCache(this.cache, expenseData.userId);

    return expense;
  }

  public async getExpenseById(id: number): Promise<Expense | null> {
    try {
      // Check cache first
      const cacheKey = CacheService.generateExpenseKey(id);
      const cached = this.cache.get<Expense>(cacheKey);

      if (cached) {
        logger.debug('ExpensesService: Cache hit for expense', { id });
        return cached;
      }

      // Fetch from database
      const expense = await this.repository.findById(id);

      // Cache for 5 minutes
      this.cache.set(cacheKey, expense, 5 * 60 * 1000);

      return expense;
    } catch (error) {
      return null;
    }
  }

  public async getAllExpenses(options: GetAllExpensesOptions): Promise<GetAllExpensesResult> {
    // Check cache first if userId is provided
    if (options.userId) {
      const cacheKey = CacheService.generateExpensesKey(
        options.userId,
        options as Record<string, unknown>
      );
      const cached = this.cache.get<GetAllExpensesResult>(cacheKey);

      if (cached) {
        logger.debug('ExpensesService: Cache hit for expenses list', { userId: options.userId });
        return cached;
      }
    }

    // Fetch from database
    const expenses = await this.repository.findAll(options);
    const total = expenses.length; // In a real app, you'd get this from the database
    const result = { expenses, total };

    // Cache for 2 minutes if userId is provided
    if (options.userId) {
      const cacheKey = CacheService.generateExpensesKey(
        options.userId,
        options as Record<string, unknown>
      );
      this.cache.set(cacheKey, result, 2 * 60 * 1000);
    }

    return result;
  }

  public async updateExpensesOrder(userId: number, orderedIds: number[]): Promise<void> {
    if (!Array.isArray(orderedIds)) {
      throw new Error('Invalid order payload');
    }
    await this.repository.updateOrder(userId, orderedIds);

    // Invalidate user's cache after reordering
    CacheService.invalidateUserCache(this.cache, userId);
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
      const expense = await this.repository.update(id, cleanUpdateData);

      // Invalidate caches
      this.cache.delete(CacheService.generateExpenseKey(id));
      if (updateData.userId) {
        CacheService.invalidateUserCache(this.cache, updateData.userId);
      }

      return expense;
    } catch (error) {
      logger.error('Error updating expense:', { error, id, updateData });
      throw error; // Re-throw to be handled by the controller
    }
  }

  public async deleteExpense(id: number, userId?: number): Promise<boolean> {
    try {
      await this.repository.delete(id);

      // Invalidate caches
      this.cache.delete(CacheService.generateExpenseKey(id));
      if (userId) {
        CacheService.invalidateUserCache(this.cache, userId);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  public async getExpensesByCategory(
    userId?: number,
    fromDate?: string,
    toDate?: string
  ): Promise<Array<{ category: string; total: number }>> {
    // Check cache first if userId is provided
    if (userId) {
      const cacheKey = CacheService.generateCategoryStatsKey(userId, fromDate, toDate);
      const cached = this.cache.get<Array<{ category: string; total: number }>>(cacheKey);

      if (cached) {
        logger.debug('ExpensesService: Cache hit for category stats', { userId });
        return cached;
      }
    }

    // Fetch from database
    const stats = await this.repository.getTotalByCategory(userId, fromDate, toDate);

    // Cache for 5 minutes if userId is provided
    if (userId) {
      const cacheKey = CacheService.generateCategoryStatsKey(userId, fromDate, toDate);
      this.cache.set(cacheKey, stats, 5 * 60 * 1000);
    }

    return stats;
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
