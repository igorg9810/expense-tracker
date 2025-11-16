import { CreateExpenseDto, Expense } from '../../src/expenses/dto/types';
import { ExpensesService } from '../../src/expenses/expenses.service';
import { ExpensesRepository } from '../../src/expenses/expenses.repository';

// Mock the repository module
jest.mock('../../src/expenses/expenses.repository');

describe('ExpensesService', () => {
  let mockCreate: jest.Mock;
  let mockFindAll: jest.Mock;
  let mockFindById: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockUpdateOrder: jest.Mock;
  let expensesService: ExpensesService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset the singleton instance
    (ExpensesService as any).instance = undefined;

    // Create mock functions
    mockCreate = jest.fn();
    mockFindAll = jest.fn();
    mockFindById = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockUpdateOrder = jest.fn();

    // Create mock repository with all needed methods
    const mockRepository = {
      create: mockCreate,
      findAll: mockFindAll,
      findById: mockFindById,
      update: mockUpdate,
      delete: mockDelete,
      updateOrder: mockUpdateOrder,
      getTotalByCategory: jest.fn(),
    };

    // Make getInstance return our mock
    (ExpensesRepository.getInstance as jest.Mock).mockReturnValue(mockRepository);

    // Create a fresh service instance
    expensesService = ExpensesService.getInstance();
  });

  describe('createExpense', () => {
    it('should create a new expense', async () => {
      const createDto: CreateExpenseDto = {
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: '2025-01-01',
      };

      const expectedExpense: Expense = {
        id: 1,
        name: createDto.name,
        amount: createDto.amount,
        currency: createDto.currency,
        category: createDto.category,
        userId: createDto.userId,
        date: '2025-01-01T00:00:00.000Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreate.mockResolvedValue(expectedExpense);

      const result = await expensesService.createExpense(createDto);

      expect(mockCreate).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedExpense);
    });

    it('should create expense with displayOrder', async () => {
      const createDto: CreateExpenseDto = {
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
        date: '2025-01-01',
        displayOrder: 5,
      };

      const expectedExpense: Expense = {
        id: 1,
        name: createDto.name,
        amount: createDto.amount,
        currency: createDto.currency,
        category: createDto.category,
        userId: createDto.userId,
        date: '2025-01-01T00:00:00.000Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayOrder: 5,
      };

      mockCreate.mockResolvedValue(expectedExpense);

      const result = await expensesService.createExpense(createDto);

      expect(mockCreate).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedExpense);
    });

    it('should handle creation errors', async () => {
      const createDto: CreateExpenseDto = {
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        userId: 1,
      };

      const error = new Error('Database error');
      mockCreate.mockRejectedValue(error);

      await expect(expensesService.createExpense(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('getAllExpenses', () => {
    it('should return all expenses for a user', async () => {
      const mockExpenses: Expense[] = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 50,
          currency: 'USD',
          category: 'Food',
          date: new Date().toISOString(),
          userId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayOrder: 0,
        },
        {
          id: 2,
          name: 'Expense 2',
          amount: 75,
          currency: 'USD',
          category: 'Transport',
          date: new Date().toISOString(),
          userId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayOrder: 1,
        },
      ];

      mockFindAll.mockResolvedValue(mockExpenses);

      const result = await expensesService.getAllExpenses({ userId: 1 });

      expect(mockFindAll).toHaveBeenCalledWith({ userId: 1 });
      expect(result).toEqual({ expenses: mockExpenses, total: 2 });
    });

    it('should filter expenses by category', async () => {
      const mockExpenses: Expense[] = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 50,
          currency: 'USD',
          category: 'Food',
          date: new Date().toISOString(),
          userId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayOrder: 0,
        },
      ];

      mockFindAll.mockResolvedValue(mockExpenses);

      const result = await expensesService.getAllExpenses({
        userId: 1,
        category: 'Food',
      });

      expect(mockFindAll).toHaveBeenCalledWith({
        userId: 1,
        category: 'Food',
      });
      expect(result).toEqual({ expenses: mockExpenses, total: 1 });
    });

    it('should handle date range filters', async () => {
      const mockExpenses: Expense[] = [];

      mockFindAll.mockResolvedValue(mockExpenses);

      const result = await expensesService.getAllExpenses({
        userId: 1,
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      });

      expect(mockFindAll).toHaveBeenCalledWith({
        userId: 1,
        fromDate: '2025-01-01',
        toDate: '2025-12-31',
      });
      expect(result).toEqual({ expenses: mockExpenses, total: 0 });
    });

    it('should handle pagination', async () => {
      const mockExpenses: Expense[] = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 50,
          currency: 'USD',
          category: 'Food',
          date: new Date().toISOString(),
          userId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          displayOrder: 0,
        },
      ];

      mockFindAll.mockResolvedValue(mockExpenses);

      const result = await expensesService.getAllExpenses({
        userId: 1,
        limit: 10,
        offset: 0,
      });

      expect(mockFindAll).toHaveBeenCalledWith({
        userId: 1,
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual({ expenses: mockExpenses, total: 1 });
    });
  });

  describe('getExpenseById', () => {
    it('should return an expense by id', async () => {
      const mockExpense: Expense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: new Date().toISOString(),
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayOrder: 0,
      };

      mockFindById.mockResolvedValue(mockExpense);

      const result = await expensesService.getExpenseById(1);

      expect(mockFindById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockExpense);
    });

    it('should handle not found errors', async () => {
      mockFindById.mockRejectedValue(new Error('Expense with id 999 not found'));

      const result = await expensesService.getExpenseById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateExpense', () => {
    it('should update an expense', async () => {
      const updateDto = { name: 'Updated Expense' };
      const updatedExpense: Expense = {
        id: 1,
        name: 'Updated Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: new Date().toISOString(),
        userId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        displayOrder: 0,
      };

      mockUpdate.mockResolvedValue(updatedExpense);

      const result = await expensesService.updateExpense(1, updateDto);

      expect(mockUpdate).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedExpense);
    });

    it('should handle update errors', async () => {
      const updateDto = { name: 'Updated Expense' };
      mockUpdate.mockRejectedValue(new Error('Expense with id 999 not found'));

      await expect(expensesService.updateExpense(999, updateDto)).rejects.toThrow(
        'Expense with id 999 not found'
      );
    });
  });

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      mockDelete.mockResolvedValue(undefined);

      const result = await expensesService.deleteExpense(1);

      expect(mockDelete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should handle deletion errors', async () => {
      mockDelete.mockRejectedValue(new Error('Expense with id 999 not found'));

      const result = await expensesService.deleteExpense(999);

      expect(result).toBe(false);
    });
  });

  describe('updateExpensesOrder', () => {
    it('should update the order of expenses', async () => {
      const orderedIds = [3, 1, 2];
      mockUpdateOrder.mockResolvedValue(undefined);

      await expensesService.updateExpensesOrder(1, orderedIds);

      expect(mockUpdateOrder).toHaveBeenCalledWith(1, orderedIds);
    });

    it('should handle empty order array', async () => {
      const orderedIds: number[] = [];
      mockUpdateOrder.mockResolvedValue(undefined);

      await expensesService.updateExpensesOrder(1, orderedIds);

      expect(mockUpdateOrder).toHaveBeenCalledWith(1, orderedIds);
    });

    it('should handle update order errors', async () => {
      const orderedIds = [1, 2, 3];
      const error = new Error('Database error');
      mockUpdateOrder.mockRejectedValue(error);

      await expect(expensesService.updateExpensesOrder(1, orderedIds)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
