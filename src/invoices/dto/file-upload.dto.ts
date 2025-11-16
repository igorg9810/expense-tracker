import { z } from 'zod';

/**
 * Schema for validating file upload
 */
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.literal('image/jpeg', {
    errorMap: () => ({ message: 'Only JPG/JPEG files are allowed' }),
  }),
  size: z.number().max(5 * 1024 * 1024, 'File size must not exceed 5MB'),
  buffer: z.instanceof(Buffer),
});

/**
 * Type for validated file upload
 */
export type ValidatedFileUpload = z.infer<typeof fileUploadSchema>;
