import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../src/users/users.controller';
import { UserService } from '../../src/users/users.service';
import { createMockRequest, createMockResponse, createMockNext, mockUser } from '../mocks';

// Mock dependencies
jest.mock('../../src/users/users.service');

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockUserService = new UserService(null as any) as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const validUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
    };

    it('should create a new user successfully', async () => {
      const mockCreatedUser = { ...mockUser, password: undefined };
      mockRequest.body = validUserData;
      mockUserService.createUser = jest.fn().mockResolvedValue(mockCreatedUser);

      await userController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.createUser).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: mockCreatedUser,
      });
    });

    it('should handle duplicate email error', async () => {
      mockRequest.body = validUserData;
      mockUserService.createUser = jest
        .fn()
        .mockRejectedValue(new Error('User with this email already exists'));

      await userController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { email: 'invalid-email' }; // Invalid data

      await userController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle general errors', async () => {
      mockRequest.body = validUserData;
      const error = new Error('Database error');
      mockUserService.createUser = jest.fn().mockRejectedValue(error);

      await userController.createUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const mockFoundUser = { ...mockUser, password: undefined };
      mockRequest.params = { id: '1' };
      mockUserService.getUserById = jest.fn().mockResolvedValue(mockFoundUser);

      await userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFoundUser,
      });
    });

    it('should handle user not found', async () => {
      mockRequest.params = { id: '999' };
      mockUserService.getUserById = jest.fn().mockResolvedValue(null);

      await userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle invalid id parameter', async () => {
      mockRequest.params = { id: 'invalid' };

      await userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle general errors', async () => {
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockUserService.getUserById = jest.fn().mockRejectedValue(error);

      await userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }];
      const mockResult = { users: mockUsers, total: 2 };
      mockRequest.query = {};
      mockUserService.getAllUsers = jest.fn().mockResolvedValue(mockResult);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(undefined, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        meta: {
          total: 2,
          limit: 2,
          offset: 0,
        },
      });
    });

    it('should get all users with pagination', async () => {
      const mockUsers = [mockUser];
      const mockResult = { users: mockUsers, total: 10 };
      mockRequest.query = { limit: '5', offset: '0' };
      mockUserService.getAllUsers = jest.fn().mockResolvedValue(mockResult);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getAllUsers).toHaveBeenCalledWith(5, 0);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        meta: {
          total: 10,
          limit: 5,
          offset: 0,
        },
      });
    });

    it('should handle general errors', async () => {
      mockRequest.query = {};
      const error = new Error('Database error');
      mockUserService.getAllUsers = jest.fn().mockRejectedValue(error);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateUser', () => {
    const validUpdateData = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const mockUpdatedUser = { ...mockUser, ...validUpdateData };
      mockRequest.params = { id: '1' };
      mockRequest.body = validUpdateData;
      mockUserService.updateUser = jest.fn().mockResolvedValue(mockUpdatedUser);

      await userController.updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, validUpdateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: mockUpdatedUser,
      });
    });

    it('should handle user not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = validUpdateData;
      mockUserService.updateUser = jest.fn().mockResolvedValue(null);

      await userController.updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle user not found error from service', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = validUpdateData;
      mockUserService.updateUser = jest.fn().mockRejectedValue(new Error('User not found'));

      await userController.updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle email already in use error', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = validUpdateData;
      mockUserService.updateUser = jest.fn().mockRejectedValue(new Error('Email already in use'));

      await userController.updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already in use',
      });
    });

    it('should handle general errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = validUpdateData;
      const error = new Error('Database error');
      mockUserService.updateUser = jest.fn().mockRejectedValue(error);

      await userController.updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest.params = { id: '1' };
      mockUserService.deleteUser = jest.fn().mockResolvedValue(true);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully',
      });
    });

    it('should handle user not found', async () => {
      mockRequest.params = { id: '999' };
      mockUserService.deleteUser = jest.fn().mockResolvedValue(false);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle user not found error from service', async () => {
      mockRequest.params = { id: '1' };
      mockUserService.deleteUser = jest.fn().mockRejectedValue(new Error('User not found'));

      await userController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should handle general errors', async () => {
      mockRequest.params = { id: '1' };
      const error = new Error('Database error');
      mockUserService.deleteUser = jest.fn().mockRejectedValue(error);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
