import { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';
import { createUserSchema, updateUserSchema, getUserByIdSchema } from './dto';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = createUserSchema.parse(req.body);

      const user = await this.userService.createUser(validatedData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getUserByIdSchema.parse(req.params);

      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await this.userService.getAllUsers(limit, offset);

      res.status(200).json({
        success: true,
        data: result.users,
        meta: {
          total: result.total,
          limit: limit || result.total,
          offset: offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getUserByIdSchema.parse(req.params);
      const validatedData = updateUserSchema.parse(req.body);

      const user = await this.userService.updateUser(id, validatedData);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'User not found' || error.message === 'Email already in use')
      ) {
        const statusCode = error.message === 'User not found' ? 404 : 409;
        res.status(statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = getUserByIdSchema.parse(req.params);

      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  };
}
