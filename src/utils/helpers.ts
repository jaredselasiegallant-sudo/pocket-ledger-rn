import { Transaction } from '../models/types';

export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txnDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txnDay.getTime() === today.getTime()) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (txnDay.getTime() === yesterday.getTime()) return 'Yesterday';

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function getMonthShort(month: number): string {
  const months = [
    '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return months[month] || '';
}

export function getMonthName(month: number): string {
  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month] || '';
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getDaysLeftInMonth(): number {
  const now = new Date();
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
  return daysInMonth - now.getDate();
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
  return date >= weekStart;
}

export function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function isThisYear(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date.getFullYear() === new Date().getFullYear();
}

export function computeMonthlyData(transactions: Transaction[]): { month: string; income: number; expenses: number }[] {
  const now = new Date();
  const monthlyMap: Record<string, { month: string; income: number; expenses: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthShort(month.getMonth() + 1);
    monthlyMap[key] = { month: key, income: 0, expenses: 0 };
  }

  for (const txn of transactions) {
    const date = new Date(txn.transactionDate);
    const key = getMonthShort(date.getMonth() + 1);
    if (!monthlyMap[key]) continue;

    if (txn.type === 'credit') {
      monthlyMap[key].income += txn.amount;
    } else {
      monthlyMap[key].expenses += txn.amount;
    }
  }

  return Object.values(monthlyMap);
}

export function computeTopMerchants(transactions: Transaction[]): { name: string; category: string; amount: number; txnCount: number }[] {
  const merchantMap: Record<string, { name: string; category: string; amount: number; txnCount: number }> = {};

  for (const txn of transactions) {
    if (txn.type === 'credit') continue;
    const name = txn.vendor || txn.account || 'Unknown';
    if (merchantMap[name]) {
      merchantMap[name].amount += txn.amount;
      merchantMap[name].txnCount += 1;
    } else {
      merchantMap[name] = {
        name,
        category: txn.category || 'Other',
        amount: txn.amount,
        txnCount: 1,
      };
    }
  }

  return Object.values(merchantMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

export function computeBalanceSpots(transactions: Transaction[]): { x: number; y: number }[] {
  const now = new Date();
  const monthlyTotals: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let balance = 0;

    for (const txn of transactions) {
      const date = new Date(txn.transactionDate);
      if (date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()) {
        balance += txn.type === 'credit' ? txn.amount : -txn.amount;
      }
    }

    monthlyTotals.push(balance);
  }

  let cumulative = 0;
  return monthlyTotals.map((val, i) => {
    cumulative += val;
    return { x: i, y: cumulative };
  });
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
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
  return colors[category] || '#9E9E9E';
}
