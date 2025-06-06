import dbService from '../db/db.service';
import { CreateExpenseDto, Expense, UpdateExpenseDto } from './dto/types';

export class ExpensesRepository {
  private static instance: ExpensesRepository;

  private constructor() {}

  public static getInstance(): ExpensesRepository {
    if (!ExpensesRepository.instance) {
      ExpensesRepository.instance = new ExpensesRepository();
    }
    return ExpensesRepository.instance;
  }

  public create(expense: CreateExpenseDto): Expense {
    const result = dbService.executeQuery<{ lastInsertRowid: number }>(
      `
            INSERT INTO expenses (name, amount, currency, category, date)
            VALUES (:name, :amount, :currency, :category, COALESCE(:date, CURRENT_TIMESTAMP))
        `,
      {
        name: expense.name,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        date: expense.date || null, // Explicitly set to null if not provided
      }
    );

    return this.findById(result.lastInsertRowid);
  }

  public findById(id: number): Expense {
    const expense = dbService.fetch<Expense>(
      `
            SELECT * FROM expenses WHERE id = :id
        `,
      { id }
    )[0];

    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }

    return expense;
  }

  public findAll(options?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Expense[] {
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params: Record<string, unknown> = {};

    if (options?.category) {
      query += ' AND category = :category';
      params.category = options.category;
    }

    if (options?.startDate) {
      query += ' AND date >= :startDate';
      params.startDate = options.startDate;
    }

    if (options?.endDate) {
      query += ' AND date <= :endDate';
      params.endDate = options.endDate;
    }

    query += ' ORDER BY date DESC';

    if (options?.limit) {
      query += ' LIMIT :limit';
      params.limit = options.limit;
    }

    if (options?.offset) {
      query += ' OFFSET :offset';
      params.offset = options.offset;
    }

    return dbService.fetch<Expense>(query, params);
  }

  public update(id: number, updateDto: UpdateExpenseDto): Expense {
    const currentExpense = this.findById(id);
    const updatedExpense = { ...currentExpense, ...updateDto };

    dbService.executeQuery(
      `
            UPDATE expenses
            SET name = :name,
                amount = :amount,
                currency = :currency,
                category = :category,
                date = :date
            WHERE id = :id
        `,
      {
        id,
        name: updatedExpense.name,
        amount: updatedExpense.amount,
        currency: updatedExpense.currency,
        category: updatedExpense.category,
        date: updatedExpense.date,
      }
    );

    return this.findById(id);
  }

  public delete(id: number): void {
    const result = dbService.executeQuery<{ changes: number }>(
      `
            DELETE FROM expenses WHERE id = :id
        `,
      { id }
    );

    if (result.changes === 0) {
      throw new Error(`Expense with id ${id} not found`);
    }
  }

  public getTotalByCategory(
    startDate?: string,
    endDate?: string
  ): Array<{ category: string; total: number }> {
    let query = `
            SELECT category, SUM(amount) as total
            FROM expenses
            WHERE 1=1
        `;
    const params: Record<string, unknown> = {};

    if (startDate) {
      query += ' AND date >= :startDate';
      params.startDate = startDate;
    }

    if (endDate) {
      query += ' AND date <= :endDate';
      params.endDate = endDate;
    }

    query += ' GROUP BY category ORDER BY total DESC';

    return dbService.fetch(query, params);
  }
}
