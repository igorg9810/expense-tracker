import prisma from '../db/prisma';
import { CreateExpenseDto, Expense } from './dto/types';
import { Expense as PrismaExpense } from '@prisma/client';
import { ExpenseEntity } from './entity/expense.entity';

export class ExpensesRepository {
  private static instance: ExpensesRepository;

  private constructor() {}

  private transformPrismaExpense(prismaExpense: PrismaExpense): Expense {
    return ExpenseEntity.fromPrisma(prismaExpense).toJSON();
  }

  public static getInstance(): ExpensesRepository {
    if (!ExpensesRepository.instance) {
      ExpensesRepository.instance = new ExpensesRepository();
    }
    return ExpensesRepository.instance;
  }

  public async create(expense: CreateExpenseDto): Promise<Expense> {
    const result = await prisma.expense.create({
      data: {
        name: expense.name,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        date: expense.date ? new Date(expense.date) : new Date(),
        userId: expense.userId,
        displayOrder: expense.displayOrder ?? 0,
      },
    });
    return this.transformPrismaExpense(result);
  }

  public async findById(id: number): Promise<Expense> {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }

    return this.transformPrismaExpense(expense);
  }

  public async findAll(options?: {
    userId?: number;
    category?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Expense[]> {
    const where: {
      userId?: number;
      category?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.fromDate) {
      where.date = {
        ...where.date,
        gte: new Date(options.fromDate),
      };
    }

    if (options?.toDate) {
      where.date = {
        ...where.date,
        lte: new Date(options.toDate),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { date: 'desc' }],
      take: options?.limit,
      skip: options?.offset,
    });
    return expenses.map((expense) => this.transformPrismaExpense(expense));
  }

  public async update(id: number, updateDto: Partial<CreateExpenseDto>): Promise<Expense> {
    // First check if the expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new Error(`Expense with id ${id} not found`);
    }

    const data: {
      name?: string;
      amount?: number;
      currency?: string;
      category?: string;
      date?: Date;
      displayOrder?: number;
    } = {};

    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.amount !== undefined) data.amount = updateDto.amount;
    if (updateDto.currency !== undefined) data.currency = updateDto.currency;
    if (updateDto.category !== undefined) data.category = updateDto.category;
    if (updateDto.date !== undefined) data.date = new Date(updateDto.date);
    const upd = updateDto as unknown as { displayOrder?: number };
    if (upd.displayOrder !== undefined) data.displayOrder = upd.displayOrder;

    const result = await prisma.expense.update({
      where: { id },
      data,
    });
    return this.transformPrismaExpense(result);
  }

  public async updateOrder(userId: number, orderedIds: number[]): Promise<void> {
    // Update each expense's displayOrder according to its position in orderedIds
    const updates = orderedIds.map((id, index) =>
      prisma.expense.updateMany({
        where: { id, userId },
        data: { displayOrder: index },
      })
    );
    await Promise.all(updates);
  }

  public async delete(id: number): Promise<void> {
    await prisma.expense.delete({
      where: { id },
    });
  }

  public async getTotalByCategory(
    userId?: number,
    fromDate?: string,
    toDate?: string
  ): Promise<Array<{ category: string; total: number }>> {
    const where: {
      userId?: number;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (userId) {
      where.userId = userId;
    }

    if (fromDate) {
      where.date = {
        ...where.date,
        gte: new Date(fromDate),
      };
    }

    if (toDate) {
      where.date = {
        ...where.date,
        lte: new Date(toDate),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      select: {
        category: true,
        amount: true,
      },
    });

    const totals = expenses.reduce(
      (acc, expense) => {
        const category = expense.category;
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }
}
