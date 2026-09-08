export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  category: string;
  name: string;
  type: TransactionType;
  checked: boolean;
  note: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface BudgetConfig {
  id: string;
  startingBalance: number;
  userId: string;
  createdAt: any;
  updatedAt: any;
}
