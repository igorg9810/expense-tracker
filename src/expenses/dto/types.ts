export interface CreateExpenseDto {
  name: string;
  amount: number;
  currency: string;
  category: string;
  date?: string; // Optional, will default to current timestamp if not provided
}

export interface Expense extends CreateExpenseDto {
  id: number;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {
  id: number;
}
