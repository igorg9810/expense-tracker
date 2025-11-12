import { Request, Response, NextFunction } from 'express';
import { User } from '../src/users/entity/user.entity';

// Mock database responses
export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  password: '$2b$10$hashedPasswordExample123456',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockRefreshToken = {
  id: 1,
  token: 'mock-refresh-token-123',
  userId: 1,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date(),
  user: mockUser,
};

export const mockResetCode = {
  id: 1,
  email: 'test@example.com',
  code: 'ABCD1234',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  createdAt: new Date(),
  user: mockUser,
};

// Mock request/response helpers
export const createMockRequest = (overrides: any = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

export const createMockResponse = (): Partial<Response> => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockNext = (): NextFunction => jest.fn();

// Mock Prisma client
export const createMockPrisma = (): any => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  resetCode: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  expense: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
});

// JWT Mock tokens
export const mockTokens = {
  accessToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.mock-access-token',
  refreshToken: 'mock-refresh-token-123',
};

// Auth middleware mock
export const mockAuthMiddleware = {
  authenticate: jest.fn((req, res, next) => {
    req.user = mockUser;
    next();
  }),
};
