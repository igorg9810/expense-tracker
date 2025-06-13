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
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Expense[]> {
    const where: {
      category?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.startDate) {
      where.date = {
        ...where.date,
        gte: new Date(options.startDate),
      };
    }

    if (options?.endDate) {
      where.date = {
        ...where.date,
        lte: new Date(options.endDate),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
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
    } = {};

    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.amount !== undefined) data.amount = updateDto.amount;
    if (updateDto.currency !== undefined) data.currency = updateDto.currency;
    if (updateDto.category !== undefined) data.category = updateDto.category;
    if (updateDto.date !== undefined) data.date = new Date(updateDto.date);

    const result = await prisma.expense.update({
      where: { id },
      data,
    });
    return this.transformPrismaExpense(result);
  }

  public async delete(id: number): Promise<void> {
    await prisma.expense.delete({
      where: { id },
    });
  }

  public async getTotalByCategory(
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ category: string; total: number }>> {
    const where: {
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (startDate) {
      where.date = {
        ...where.date,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate),
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
