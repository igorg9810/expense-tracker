import { UserRepository } from './users.repository';
import { UserWithoutPassword } from './entity';
import { CreateUserInput, UpdateUserInput } from './dto';
import { logger } from '../helpers/Logger';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(userData: CreateUserInput): Promise<UserWithoutPassword> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.existsByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Note: Password hashing should be done here before saving
      // For now, we're storing plain text (not recommended for production)
      const user = await this.userRepository.create(userData);

      logger.info('User service: User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('User service: Error creating user', { error, email: userData.email });
      throw error;
    }
  }

  async getUserById(id: number): Promise<UserWithoutPassword | null> {
    try {
      const user = await this.userRepository.findById(id);
      return user;
    } catch (error) {
      logger.error('User service: Error getting user by ID', { error, userId: id });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserWithoutPassword | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) return null;

      // Return user without password
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error('User service: Error getting user by email', { error, email });
      throw error;
    }
  }

  async getAllUsers(
    limit?: number,
    offset?: number
  ): Promise<{ users: UserWithoutPassword[]; total: number }> {
    try {
      const [users, total] = await Promise.all([
        this.userRepository.findAll(limit, offset),
        this.userRepository.count(),
      ]);

      return { users, total };
    } catch (error) {
      logger.error('User service: Error getting all users', { error });
      throw error;
    }
  }

  async updateUser(id: number, userData: UpdateUserInput): Promise<UserWithoutPassword | null> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // If email is being updated, check if the new email is already taken
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.userRepository.existsByEmail(userData.email);
        if (emailExists) {
          throw new Error('Email already in use');
        }
      }

      // Note: Password hashing should be done here if password is being updated
      const updatedUser = await this.userRepository.update(id, userData);

      logger.info('User service: User updated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      logger.error('User service: Error updating user', { error, userId: id });
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const result = await this.userRepository.delete(id);

      logger.info('User service: User deleted successfully', { userId: id });
      return result;
    } catch (error) {
      logger.error('User service: Error deleting user', { error, userId: id });
      throw error;
    }
  }

  async userExists(email: string): Promise<boolean> {
    try {
      return await this.userRepository.existsByEmail(email);
    } catch (error) {
      logger.error('User service: Error checking if user exists', { error, email });
      throw error;
    }
  }
}
