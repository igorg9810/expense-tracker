import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
});

export const getUserByIdSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => {
    const numVal = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(numVal)) {
      throw new Error('ID must be a valid number');
    }
    return numVal;
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUserByIdInput = z.infer<typeof getUserByIdSchema>;
