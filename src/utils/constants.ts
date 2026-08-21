export const APP_NAME = 'PocketLedger';
export const APP_VERSION = '1.0.0';

export const DEFAULT_CURRENCY_CODE = 'GHS';
export const DEFAULT_CURRENCY_SYMBOL = 'GH\u00A2';
export const DEFAULT_CURRENCY_NAME = 'Ghana Cedi';

export const DB_NAME = 'pocket_ledger.db';
export const DB_VERSION = 1;

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Utilities',
  'Health',
  'Education',
  'Entertainment',
  'Shopping',
  'Savings',
  'Investment',
  'Salary',
  'Business',
  'Gifts',
  'Rent',
  'Communication',
  'Other',
];

export const MOBILE_MONEY_PROVIDERS = [
  'MTN MoMo',
  'MTN Mobile Money',
  'Telecel Cash',
  'AT Money',
  'Vodafone Cash',
];

export const BANK_PROVIDERS = [
  'GCB',
  'Ecobank',
  'Fidelity',
  'Stanbic',
  'Absa',
  'CalBank',
  'Republic Bank',
  'SCB',
  'UBA',
  'Zenith',
  'Consolidated Bank',
  'Prudential Bank',
  'First Atlantic',
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#FF6D00',
  Transport: '#2962FF',
  Utilities: '#00BFA5',
  Health: '#D50000',
  Education: '#AA00FF',
  Entertainment: '#FF1744',
  Shopping: '#E91E63',
  Savings: '#00C853',
  Investment: '#6200EA',
  Salary: '#00B0FF',
  Business: '#FFD600',
  Gifts: '#FF4081',
  Rent: '#795548',
  Communication: '#00BCD4',
  Other: '#9E9E9E',
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Food & Dining': 'restaurant',
  Transport: 'directions-car',
  Utilities: 'bolt',
  Health: 'local-hospital',
  Education: 'school',
  Entertainment: 'movie',
  Shopping: 'shopping-bag',
  Savings: 'savings',
  Investment: 'trending-up',
  Salary: 'work',
  Business: 'business',
  Gifts: 'card-giftcard',
  Rent: 'home',
  Communication: 'phone',
  Other: 'category',
};

export const TRANSACTION_TYPES = [
  { label: 'Expense', value: 'debit' as const, color: '#DE350B' },
  { label: 'Income', value: 'credit' as const, color: '#00875A' },
  { label: 'Transfer', value: 'transfer' as const, color: '#0065FF' },
];

export const THEME_STORAGE_KEY = 'theme_mode';
export const CURRENCY_STORAGE_KEY = 'currency_code';
