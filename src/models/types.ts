export type TransactionType = 'credit' | 'debit' | 'transfer';
export type AccountType = 'mobile_money' | 'bank' | 'cash' | 'investment';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: number;
  uuid: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  type: TransactionType;
  category: string;
  vendor: string | null;
  reference: string | null;
  provider: string | null;
  account: string | null;
  isAutoCaptured: boolean;
  isRecurring: boolean;
  recurringFrequency: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface TransactionInput {
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  category: string;
  vendor?: string;
  reference?: string;
  provider?: string;
  account?: string;
  transactionDate?: string;
  isRecurring?: boolean;
}

export interface Budget {
  id: number;
  uuid: string;
  name: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  name: string;
  category: string;
  limitAmount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

export interface Account {
  id: number;
  uuid: string;
  name: string;
  type: AccountType;
  provider: string | null;
  balance: number;
  currency: string;
  accountNumber: string | null;
  isActive: boolean;
  includeInTotal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  provider?: string;
  initialBalance?: number;
  accountNumber?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface CategoryData {
  name: string;
  total: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface MerchantData {
  name: string;
  category: string;
  amount: number;
  txnCount: number;
}
