import { UserService } from '../../src/users/users.service';
import { UserRepository } from '../../src/users/users.repository';
import { logger } from '../../src/helpers/Logger';
import { mockUser } from '../mocks';

// Mock dependencies
jest.mock('../../src/users/users.repository');
jest.mock('../../src/helpers/Logger');

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = new UserRepository(null as any) as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
    };

    it('should create a new user successfully', async () => {
      const mockCreatedUser = { ...mockUser, password: undefined };

      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(false);
      mockUserRepository.create = jest.fn().mockResolvedValue(mockCreatedUser);

      const result = await userService.createUser(createUserData);

      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(createUserData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserData);
      expect(result).toEqual(mockCreatedUser);
      expect(logger.info).toHaveBeenCalledWith('User service: User created successfully', {
        userId: mockCreatedUser.id,
      });
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(true);

      await expect(userService.createUser(createUserData)).rejects.toThrow(
        'User with this email already exists'
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('User service: Error creating user', {
        error: expect.any(Error),
        email: createUserData.email,
      });
    });

    it('should handle repository errors', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(false);
      mockUserRepository.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(createUserData)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const mockFoundUser = { ...mockUser, password: undefined };
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockFoundUser);

      const result = await userService.getUserById(1);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFoundUser);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findById = jest.fn().mockResolvedValue(null);

      const result = await userService.getUserById(999);

      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockUserRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserById(1)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('User service: Error getting user by ID', {
        error: expect.any(Error),
        userId: 1,
      });
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email successfully', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findByEmail = jest.fn().mockResolvedValue(null);

      const result = await userService.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle repository errors', async () => {
      mockUserRepository.findByEmail = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.getUserByEmail('test@example.com')).rejects.toThrow(
        'Database error'
      );
      expect(logger.error).toHaveBeenCalledWith('User service: Error getting user by email', {
        error: expect.any(Error),
        email: 'test@example.com',
      });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { ...mockUser, password: undefined },
        { ...mockUser, id: 2, email: 'test2@example.com', password: undefined },
      ];

      mockUserRepository.findAll = jest.fn().mockResolvedValue(mockUsers);
      mockUserRepository.count = jest.fn().mockResolvedValue(2);

      const result = await userService.getAllUsers();

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(mockUserRepository.count).toHaveBeenCalled();
      expect(result).toEqual({
        users: mockUsers,
        total: 2,
      });
    });

    it('should get users with pagination', async () => {
      const mockUsers = [{ ...mockUser, password: undefined }];

      mockUserRepository.findAll = jest.fn().mockResolvedValue(mockUsers);
      mockUserRepository.count = jest.fn().mockResolvedValue(10);

      const result = await userService.getAllUsers(5, 0);

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(5, 0);
      expect(result).toEqual({
        users: mockUsers,
        total: 10,
      });
    });

    it('should handle repository errors', async () => {
      mockUserRepository.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.getAllUsers()).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('User service: Error getting all users', {
        error: expect.any(Error),
      });
    });
  });

  describe('updateUser', () => {
    const updateData = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should update user successfully', async () => {
      const mockUpdatedUser = { ...mockUser, ...updateData, password: undefined };

      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(false);
      mockUserRepository.update = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(1, updateData);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(updateData.email);
      expect(mockUserRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(mockUpdatedUser);
      expect(logger.info).toHaveBeenCalledWith('User service: User updated successfully', {
        userId: 1,
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.updateUser(999, updateData)).rejects.toThrow('User not found');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if email already in use', async () => {
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(true);

      await expect(userService.updateUser(1, updateData)).rejects.toThrow('Email already in use');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should not check email availability if email is not being updated', async () => {
      const updateDataNoEmail = { name: 'Updated Name' };
      const mockUpdatedUser = { ...mockUser, name: 'Updated Name', password: undefined };

      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepository.update = jest.fn().mockResolvedValue(mockUpdatedUser);

      const result = await userService.updateUser(1, updateDataNoEmail);

      expect(mockUserRepository.existsByEmail).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should not check email availability if email is same as current', async () => {
      const updateDataSameEmail = { email: mockUser.email };
      const mockUpdatedUser = { ...mockUser, password: undefined };

      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepository.update = jest.fn().mockResolvedValue(mockUpdatedUser);

      await userService.updateUser(1, updateDataSameEmail);

      expect(mockUserRepository.existsByEmail).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockUserRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.updateUser(1, updateData)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('User service: Error updating user', {
        error: expect.any(Error),
        userId: 1,
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.findById = jest.fn().mockResolvedValue(mockUser);
      mockUserRepository.delete = jest.fn().mockResolvedValue(true);

      const result = await userService.deleteUser(1);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('User service: User deleted successfully', {
        userId: 1,
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(userService.deleteUser(999)).rejects.toThrow('User not found');

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      mockUserRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.deleteUser(1)).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('User service: Error deleting user', {
        error: expect.any(Error),
        userId: 1,
      });
    });
  });

  describe('userExists', () => {
    it('should return true if user exists', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(true);

      const result = await userService.userExists('test@example.com');

      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockResolvedValue(false);

      const result = await userService.userExists('notfound@example.com');

      expect(result).toBe(false);
    });

    it('should handle repository errors', async () => {
      mockUserRepository.existsByEmail = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(userService.userExists('test@example.com')).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('User service: Error checking if user exists', {
        error: expect.any(Error),
        email: 'test@example.com',
      });
    });
  });
});
