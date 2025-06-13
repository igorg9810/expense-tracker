import { Expense as PrismaExpense } from '@prisma/client';
import { Expense } from '../dto/types';

/**
 * Represents an expense entity in the database
 */
export class ExpenseEntity implements PrismaExpense {
  id: number;
  name: string;
  amount: number;
  currency: string;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: PrismaExpense) {
    this.id = data.id;
    this.name = data.name;
    this.amount = data.amount;
    this.currency = data.currency;
    this.category = data.category;
    this.date = data.date;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Creates a new ExpenseEntity from a Prisma Expense
   */
  static fromPrisma(data: PrismaExpense): ExpenseEntity {
    return new ExpenseEntity(data);
  }

  /**
   * Converts the entity to a plain object matching the Expense DTO type
   */
  toJSON(): Expense {
    return {
      id: this.id,
      name: this.name,
      amount: this.amount,
      currency: this.currency,
      category: this.category,
      date: this.date.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
