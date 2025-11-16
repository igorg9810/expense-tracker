import { ExpenseEntity } from '../../src/expenses/entity/expense.entity';
import { Expense as PrismaExpense } from '@prisma/client';

describe('ExpenseEntity', () => {
  describe('fromPrisma', () => {
    it('should convert Prisma expense to ExpenseEntity', () => {
      const prismaExpense: PrismaExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: new Date('2025-01-01'),
        userId: 1,
        displayOrder: 0,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);

      expect(entity).toBeInstanceOf(ExpenseEntity);
      const json = entity.toJSON();
      expect(json.id).toBe(1);
      expect(json.name).toBe('Test Expense');
      expect(json.amount).toBe(100);
      expect(json.currency).toBe('USD');
      expect(json.category).toBe('Food');
      expect(json.date).toBe('2025-01-01T00:00:00.000Z');
      expect(json.userId).toBe(1);
      expect(json.displayOrder).toBe(0);
      expect(json.createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(json.updatedAt).toBe('2025-01-02T00:00:00.000Z');
    });

    it('should handle expense with custom displayOrder', () => {
      const prismaExpense: PrismaExpense = {
        id: 2,
        name: 'Another Expense',
        amount: 200,
        currency: 'EUR',
        category: 'Transport',
        date: new Date('2025-02-01'),
        userId: 2,
        displayOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);
      const json = entity.toJSON();

      expect(json.displayOrder).toBe(5);
    });

    it('should handle expense with zero displayOrder', () => {
      const prismaExpense: PrismaExpense = {
        id: 3,
        name: 'Zero Order Expense',
        amount: 50,
        currency: 'USD',
        category: 'Food',
        date: new Date(),
        userId: 1,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);
      const json = entity.toJSON();

      expect(json.displayOrder).toBe(0);
    });
  });

  describe('toJSON', () => {
    it('should serialize all expense properties', () => {
      const prismaExpense: PrismaExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100.5,
        currency: 'USD',
        category: 'Entertainment',
        date: new Date('2025-03-15'),
        userId: 1,
        displayOrder: 3,
        createdAt: new Date('2025-03-01T10:00:00Z'),
        updatedAt: new Date('2025-03-10T10:00:00Z'),
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);
      const json = entity.toJSON();

      expect(json).toHaveProperty('id', 1);
      expect(json).toHaveProperty('name', 'Test Expense');
      expect(json).toHaveProperty('amount', 100.5);
      expect(json).toHaveProperty('currency', 'USD');
      expect(json).toHaveProperty('category', 'Entertainment');
      expect(json).toHaveProperty('date');
      expect(json).toHaveProperty('userId', 1);
      expect(json).toHaveProperty('displayOrder', 3);
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });

    it('should preserve Date objects', () => {
      const testDate = new Date('2025-06-01T12:00:00Z');
      const createdAt = new Date('2025-05-01T08:00:00Z');
      const updatedAt = new Date('2025-05-15T09:00:00Z');

      const prismaExpense: PrismaExpense = {
        id: 1,
        name: 'Test',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: testDate,
        userId: 1,
        displayOrder: 0,
        createdAt: createdAt,
        updatedAt: updatedAt,
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);
      const json = entity.toJSON();

      expect(json.date).toBe(testDate.toISOString());
      expect(json.createdAt).toBe(createdAt.toISOString());
      expect(json.updatedAt).toBe(updatedAt.toISOString());
    });

    it('should handle negative amounts', () => {
      const prismaExpense: PrismaExpense = {
        id: 1,
        name: 'Refund',
        amount: -50,
        currency: 'USD',
        category: 'Refunds',
        date: new Date(),
        userId: 1,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);
      const json = entity.toJSON();

      expect(json.amount).toBe(-50);
    });

    it('should handle large displayOrder values', () => {
      const prismaExpense: PrismaExpense = {
        id: 1,
        name: 'Test',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: new Date(),
        userId: 1,
        displayOrder: 999999,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = ExpenseEntity.fromPrisma(prismaExpense);
      const json = entity.toJSON();

      expect(json.displayOrder).toBe(999999);
    });
  });

  describe('constructor', () => {
    it('should create entity with all properties', () => {
      const data = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: new Date(),
        userId: 1,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const entity = new ExpenseEntity(data);
      const json = entity.toJSON();

      expect(json.id).toBe(data.id);
      expect(json.amount).toBe(data.amount);
      expect(json.displayOrder).toBe(data.displayOrder);
    });
  });
});
