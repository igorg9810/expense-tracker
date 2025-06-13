import { z } from 'zod';

export const createExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().datetime().optional(),
});

const baseUpdateSchema = {
  name: z.string().min(1, 'Name is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().min(1, 'Currency is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  date: z.string().datetime().optional(),
};

export const updateExpenseSchema = z
  .object(baseUpdateSchema)
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
    path: [], // This makes the error appear at the root level
  });

export const expenseIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid expense ID');
    }
    return num;
  }),
});

export const expenseQuerySchema = z.object({
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});
