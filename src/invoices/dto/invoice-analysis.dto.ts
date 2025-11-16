import { z } from 'zod';

/**
 * Invoice Analysis Response DTO
 * Represents the parsed data from an invoice image
 */
export interface InvoiceAnalysisResponse {
  /** Name/description of the expense or vendor */
  name: string;
  /** Amount of the expense */
  amount: number;
  /** Currency of the expense (USD or EUR) */
  currency?: 'USD' | 'EUR';
  /** Date of the expense in ISO format */
  date: string;
}

/**
 * Invoice Analysis Error Response DTO
 */
export interface InvoiceAnalysisErrorResponse {
  /** Error message */
  error: string;
  /** Additional error details if available */
  details?: string;
}

/**
 * Zod schema for validating extracted invoice data
 */
export const invoiceDataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  amount: z.number().positive('Amount must be positive').finite('Amount must be finite'),
  currency: z.enum(['USD', 'EUR']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

/**
 * Type for validated invoice data
 */
export type ValidatedInvoiceData = z.infer<typeof invoiceDataSchema>;
