import { Router } from 'express';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { AuthMiddleware, AuthRequest } from '../auth/auth.middleware';
import { UserController } from '../users/users.controller';
import { UserService } from '../users/users.service';
import { UserRepository } from '../users/users.repository';
import { validateRequest } from '../helpers/middlewares/validator';
import { authLimiter, strictLimiter, sanitizeInput } from '../helpers/middlewares/security';
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  restorePasswordSchema,
} from '../auth/dto';
import { createUserSchema, updateUserSchema, getUserByIdSchema } from '../users/dto';
import prisma from '../db/prisma';

// Initialize dependencies
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);

const authController = new AuthController(authService);
const userController = new UserController(userService);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// Auth routes (public) - with rate limiting and input sanitization
router.post(
  '/auth/sign-up',
  authLimiter,
  sanitizeInput,
  validateRequest({ body: signUpSchema }),
  authController.signUp
);

router.post(
  '/auth/sign-in',
  authLimiter,
  sanitizeInput,
  validateRequest({ body: signInSchema }),
  authController.signIn
);

router.post('/auth/refresh', authLimiter, authController.refreshToken);

router.post(
  '/auth/forgot-password',
  strictLimiter,
  sanitizeInput,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  '/auth/restore-password',
  strictLimiter,
  sanitizeInput,
  validateRequest({ body: restorePasswordSchema }),
  authController.restorePassword
);

// Logout routes
router.get('/auth/logout', authLimiter, authController.logout);

router.get('/auth/logoutAll', authLimiter, authMiddleware.authenticate, authController.logoutAll);

// User routes (protected)
router.get('/users', authMiddleware.authenticate, userController.getAllUsers);

router.get('/users/me', authMiddleware.authenticate, (req: AuthRequest, res) => {
  // Simple endpoint to get current user info from token
  res.json({
    success: true,
    data: req.user,
  });
});

router.get(
  '/users/:id',
  authMiddleware.authenticate,
  validateRequest({ params: getUserByIdSchema }),
  userController.getUserById
);

router.post(
  '/users',
  authMiddleware.authenticate,
  validateRequest({ body: createUserSchema }),
  userController.createUser
);

router.patch(
  '/users/:id',
  authMiddleware.authenticate,
  validateRequest({
    params: getUserByIdSchema,
    body: updateUserSchema,
  }),
  userController.updateUser
);

router.delete(
  '/users/:id',
  authMiddleware.authenticate,
  validateRequest({ params: getUserByIdSchema }),
  userController.deleteUser
);

export { router as authUserRoutes, authMiddleware };
