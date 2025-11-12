import { PrismaClient } from '@prisma/client';
import { CreateUserData, UpdateUserData, User, UserWithoutPassword } from './entity';
import { logger } from '../helpers/Logger';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(userData: CreateUserData): Promise<UserWithoutPassword> {
    try {
      logger.info('Creating new user', { email: userData.email });

      const user = await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Error creating user', { error, userData: { email: userData.email } });
      throw error;
    }
  }

  async findById(id: number): Promise<UserWithoutPassword | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user by ID', { error, userId: id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async findAll(limit?: number, offset?: number): Promise<UserWithoutPassword[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users;
    } catch (error) {
      logger.error('Error finding all users', { error });
      throw error;
    }
  }

  async update(id: number, userData: UpdateUserData): Promise<UserWithoutPassword | null> {
    try {
      logger.info('Updating user', { userId: id });

      const user = await this.prisma.user.update({
        where: { id },
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User updated successfully', { userId: id });
      return user;
    } catch (error) {
      logger.error('Error updating user', { error, userId: id });
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      logger.info('Deleting user', { userId: id });

      await this.prisma.user.delete({
        where: { id },
      });

      logger.info('User deleted successfully', { userId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting user', { error, userId: id });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const count = await this.prisma.user.count();
      return count;
    } catch (error) {
      logger.error('Error counting users', { error });
      throw error;
    }
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    try {
      logger.info('Updating user password', { userId });

      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info('User password updated successfully', { userId });
    } catch (error) {
      logger.error('Error updating user password', { error, userId });
      throw error;
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      logger.error('Error checking if user exists by email', { error, email });
      throw error;
    }
  }
}
