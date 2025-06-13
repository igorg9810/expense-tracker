import { Request, Response } from 'express';
import { ExpensesController } from '../expenses/expenses.controller';
import { expensesService } from '../expenses/expenses.service';
import { ValidationError } from '../helpers/middlewares/errorHandler';

// Mock the expenses service
jest.mock('../expenses/expenses.service');

describe('ExpensesController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let controller: ExpensesController;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    controller = ExpensesController.getInstance();
    jest.clearAllMocks();
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

      await controller.getExpenseById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(expensesService.getExpenseById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockExpense);
    });

    it('should return 404 when expense does not exist', async () => {
      (expensesService.getExpenseById as jest.Mock).mockResolvedValue(null);
      mockRequest.params = { id: '999' };

      await controller.getExpenseById(mockRequest as Request, mockResponse as Response, mockNext);

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

      await controller.getExpenseById(mockRequest as Request, mockResponse as Response, mockNext);

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

      await controller.createExpense(mockRequest as Request, mockResponse as Response, mockNext);

      expect(expensesService.createExpense).toHaveBeenCalledWith(mockExpense);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdExpense);
    });

    it('should handle validation errors', async () => {
      const validationError = new ValidationError('Validation failed');
      (expensesService.createExpense as jest.Mock).mockRejectedValue(validationError);
      mockRequest.body = {};

      await controller.createExpense(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });
});
