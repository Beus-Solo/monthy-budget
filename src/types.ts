export type TransactionType = 'income' | 'expense';
export type TransactionKind = 'bill' | 'shopping';

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  category: string;
  name: string;
  type: TransactionType;
  kind: TransactionKind;
  checked: boolean;
  recurring: boolean;
  note: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}
