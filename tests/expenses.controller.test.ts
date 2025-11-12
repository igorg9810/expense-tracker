import { Request, Response } from 'express';
import { expensesController } from '../src/expenses/expenses.controller';
import { expensesService } from '../src/expenses/expenses.service';
import { ValidationError } from '../src/helpers/middlewares/errorHandler';
import { AuthRequest } from '../src/auth/auth.middleware';

// Mock the expenses service
jest.mock('../src/expenses/expenses.service');

describe('ExpensesController', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 1, email: 'test@example.com' },
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllExpenses', () => {
    it('should return a list of expenses', async () => {
      const mockExpenses = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 50,
          currency: 'USD',
          category: 'Cat1',
          date: new Date(),
        },
        {
          id: 2,
          name: 'Expense 2',
          amount: 75,
          currency: 'USD',
          category: 'Cat2',
          date: new Date(),
        },
      ];
      (expensesService.getAllExpenses as jest.Mock).mockResolvedValue({
        expenses: mockExpenses,
        total: 2,
      });
      mockRequest.query = {};

      await expensesController.getAllExpenses(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.getAllExpenses).toHaveBeenCalledWith({
        userId: 1,
        limit: undefined,
        offset: undefined,
        category: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockExpenses,
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should handle query parameters', async () => {
      const mockExpenses = [
        {
          id: 1,
          name: 'Expense 1',
          amount: 50,
          currency: 'USD',
          category: 'Food',
          date: new Date(),
        },
      ];
      (expensesService.getAllExpenses as jest.Mock).mockResolvedValue({
        expenses: mockExpenses,
        total: 1,
      });
      mockRequest.query = { category: 'Food' };

      await expensesController.getAllExpenses(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.getAllExpenses).toHaveBeenCalledWith({
        category: 'Food',
        userId: 1,
        limit: undefined,
        offset: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockExpenses,
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      (expensesService.getAllExpenses as jest.Mock).mockRejectedValue(error);
      mockRequest.query = {};

      await expensesController.getAllExpenses(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getExpenseById', () => {
    it('should return an expense when it exists', async () => {
      const mockExpense = {
        id: 1,
        name: 'Test Expense',
        amount: 100,
        currency: 'USD',
        category: 'Food',
        date: new Date(),
      };

      (expensesService.getExpenseById as jest.Mock).mockResolvedValue(mockExpense);
      mockRequest.params = { id: '1' };

      await expensesController.getExpenseById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.getExpenseById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockExpense);
    });

    it('should return 404 when expense does not exist', async () => {
      (expensesService.getExpenseById as jest.Mock).mockResolvedValue(null);
      mockRequest.params = { id: '999' };

      await expensesController.getExpenseById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.getExpenseById).toHaveBeenCalledWith(999);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Expense with id 999 not found',
        })
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      (expensesService.getExpenseById as jest.Mock).mockRejectedValue(error);
      mockRequest.params = { id: '1' };

      await expensesController.getExpenseById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createExpense', () => {
    it('should create a new expense', async () => {
      const mockExpense = {
        name: 'New Expense',
        amount: 200,
        currency: 'USD',
        category: 'Food',
      };

      const createdExpense = {
        id: 1,
        ...mockExpense,
        date: new Date(),
      };

      (expensesService.createExpense as jest.Mock).mockResolvedValue(createdExpense);
      mockRequest.body = mockExpense;

      await expensesController.createExpense(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.createExpense).toHaveBeenCalledWith({
        ...mockExpense,
        userId: 1,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdExpense);
    });

    it('should handle validation errors', async () => {
      const validationError = new ValidationError('Validation failed');
      (expensesService.createExpense as jest.Mock).mockRejectedValue(validationError);
      mockRequest.body = {};

      await expensesController.createExpense(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('updateExpense', () => {
    it('should update an expense', async () => {
      const updateData = { name: 'Updated Expense' };
      const updatedExpense = {
        id: 1,
        name: 'Updated Expense',
        amount: 200,
        currency: 'USD',
        category: 'Food',
        date: new Date(),
      };

      (expensesService.updateExpense as jest.Mock).mockResolvedValue(updatedExpense);
      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;

      await expensesController.updateExpense(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.updateExpense).toHaveBeenCalledWith(1, updateData);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedExpense);
    });

    it('should return 404 if expense to update is not found', async () => {
      (expensesService.updateExpense as jest.Mock).mockResolvedValue(null);
      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Non-existent' };

      await expensesController.updateExpense(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Expense with id 999 not found',
        })
      );
    });
  });

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      (expensesService.deleteExpense as jest.Mock).mockResolvedValue(true);
      mockRequest.params = { id: '1' };

      await expensesController.deleteExpense(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(expensesService.deleteExpense).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should return 404 if expense to delete is not found', async () => {
      (expensesService.deleteExpense as jest.Mock).mockResolvedValue(false);
      mockRequest.params = { id: '999' };

      await expensesController.deleteExpense(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Expense with id 999 not found',
        })
      );
    });
  });
});
