import { ExpensesRepository } from '../../src/expenses/expenses.repository';
import { CreateExpenseDto } from '../../src/expenses/dto/types';
import prisma from '../../src/db/prisma';

jest.mock('../../src/db/prisma', () => ({
  __esModule: true,
  default: {
    expense: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ExpensesRepository', () => {
  let repository: ExpensesRepository;

  beforeEach(() => {
    repository = ExpensesRepository.getInstance();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new expense', async () => {
      const createDto: CreateExpenseDto = {
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: '2025-01-01',
      };

      const mockCreatedExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date('2025-01-01'),
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.expense.create as jest.Mock).mockResolvedValue(mockCreatedExpense);

      const result = await repository.create(createDto);

      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Expense',
          amount: 100,
          currency: 'USD',
          category: 'Food',
          userId: 1,
          date: new Date('2025-01-01'),
          displayOrder: 0,
        },
      });
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test Expense');
    });

    it('should create expense with custom displayOrder', async () => {
      const createDto: CreateExpenseDto = {
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        displayOrder: 5,
      };

      const mockCreatedExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date(),
        displayOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.expense.create as jest.Mock).mockResolvedValue(mockCreatedExpense);

      const result = await repository.create(createDto);

      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayOrder: 5,
        }),
      });
      expect(result).toHaveProperty('displayOrder', 5);
    });

    it('should use default date if not provided', async () => {
      const createDto: CreateExpenseDto = {
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
      };

      const mockCreatedExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date(),
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.expense.create as jest.Mock).mockResolvedValue(mockCreatedExpense);

      await repository.create(createDto);

      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          date: expect.any(Date),
        }),
      });
    });
  });

  describe('findById', () => {
    it('should return an expense by id', async () => {
      const mockExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date(),
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(mockExpense);

      const result = await repository.findById(1);

      expect(prisma.expense.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw error if expense not found', async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(repository.findById(999)).rejects.toThrow('Expense with id 999 not found');
    });
  });

  describe('findAll', () => {
    it('should return all expenses ordered by displayOrder then date', async () => {
      const mockExpenses = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 100,
          currency: 'USD',
          category: 'Food',
          userId: 1,
          date: new Date(),
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Expense 2',
          amount: 50,
          currency: 'USD',
          category: 'Transport',
          userId: 1,
          date: new Date(),
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const result = await repository.findAll({ userId: 1 });

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: [{ displayOrder: 'asc' }, { date: 'desc' }],
        take: undefined,
        skip: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('displayOrder', 0);
      expect(result[1]).toHaveProperty('displayOrder', 1);
    });

    it('should filter by category', async () => {
      const mockExpenses = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 100,
          currency: 'USD',
          category: 'Food',
          userId: 1,
          date: new Date(),
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const result = await repository.findAll({ userId: 1, category: 'Food' });

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 1, category: 'Food' },
        orderBy: [{ displayOrder: 'asc' }, { date: 'desc' }],
        take: undefined,
        skip: undefined,
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      const mockExpenses: any[] = [];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      await repository.findAll({
        userId: 1,
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      });

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          date: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-12-31'),
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { date: 'desc' }],
        take: undefined,
        skip: undefined,
      });
    });

    it('should apply pagination', async () => {
      const mockExpenses: any[] = [];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      await repository.findAll({
        userId: 1,
        limit: 10,
        offset: 5,
      });

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: [{ displayOrder: 'asc' }, { date: 'desc' }],
        take: 10,
        skip: 5,
      });
    });
  });

  describe('update', () => {
    it('should update an expense', async () => {
      const existingExpense = {
        id: 1,
        name: 'Old Name',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date(),
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedExpense = {
        ...existingExpense,
        name: 'New Name',
      };

      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(existingExpense);
      (prisma.expense.update as jest.Mock).mockResolvedValue(updatedExpense);

      const result = await repository.update(1, { name: 'New Name' });

      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
      expect(result).toHaveProperty('name', 'New Name');
    });

    it('should update displayOrder', async () => {
      const existingExpense = {
        id: 1,
        name: 'Test',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date(),
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedExpense = {
        ...existingExpense,
        displayOrder: 5,
      };

      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(existingExpense);
      (prisma.expense.update as jest.Mock).mockResolvedValue(updatedExpense);

      const result = await repository.update(1, { displayOrder: 5 } as any);

      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { displayOrder: 5 },
      });
      expect(result).toHaveProperty('displayOrder', 5);
    });

    it('should throw error if expense not found', async () => {
      (prisma.expense.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(repository.update(999, { name: 'New Name' })).rejects.toThrow(
        'Expense with id 999 not found'
      );
    });
  });

  describe('updateOrder', () => {
    it('should update displayOrder for multiple expenses', async () => {
      const orderedIds = [3, 1, 2];

      (prisma.expense.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await repository.updateOrder(1, orderedIds);

      expect(prisma.expense.updateMany).toHaveBeenCalledTimes(3);
      expect(prisma.expense.updateMany).toHaveBeenNthCalledWith(1, {
        where: { id: 3, userId: 1 },
        data: { displayOrder: 0 },
      });
      expect(prisma.expense.updateMany).toHaveBeenNthCalledWith(2, {
        where: { id: 1, userId: 1 },
        data: { displayOrder: 1 },
      });
      expect(prisma.expense.updateMany).toHaveBeenNthCalledWith(3, {
        where: { id: 2, userId: 1 },
        data: { displayOrder: 2 },
      });
    });

    it('should handle empty array', async () => {
      await repository.updateOrder(1, []);

      expect(prisma.expense.updateMany).not.toHaveBeenCalled();
    });

    it('should handle single expense', async () => {
      (prisma.expense.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await repository.updateOrder(1, [5]);

      expect(prisma.expense.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.expense.updateMany).toHaveBeenCalledWith({
        where: { id: 5, userId: 1 },
        data: { displayOrder: 0 },
      });
    });
  });

  describe('delete', () => {
    it('should delete an expense', async () => {
      const mockExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: new Date(),
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.expense.delete as jest.Mock).mockResolvedValue(mockExpense);

      await repository.delete(1);

      expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('getTotalByCategory', () => {
    it('should return totals by category', async () => {
      const mockExpenses = [
        { category: 'Food', amount: 100 },
        { category: 'Food', amount: 50 },
        { category: 'Transport', amount: 75 },
      ];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const result = await repository.getTotalByCategory(1);

      expect(result).toEqual([
        { category: 'Food', total: 150 },
        { category: 'Transport', total: 75 },
      ]);
    });

    it('should filter by date range', async () => {
      const mockExpenses = [{ category: 'Food', amount: 100 }];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      await repository.getTotalByCategory(1, '2025-01-01', '2025-12-31');

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          date: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-12-31'),
          },
        },
        select: {
          category: true,
          amount: true,
        },
      });
    });

    it('should handle expenses with no userId filter', async () => {
      const mockExpenses = [{ category: 'Food', amount: 100 }];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      await repository.getTotalByCategory();

      expect(prisma.expense.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          category: true,
          amount: true,
        },
      });
    });
  });
});
