import { BudgetPeriod, Transaction } from '../models/types';

export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr); const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (day.getTime() === today.getTime()) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (day.getTime() === yesterday.getTime()) return 'Yesterday';
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function getMonthShort(month: number): string {
  return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month] || '';
}
export function getMonthName(month: number): string {
  return ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month] || '';
}
export function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
export function getDaysLeftInMonth() { const now = new Date(); return getDaysInMonth(now.getFullYear(), now.getMonth()) - now.getDate(); }
export function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

export function getRangeForLabel(label: string, now = new Date()): { start: Date; end: Date } {
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (label === 'This Week') { const day = start.getDay() || 7; start.setDate(start.getDate() - day + 1); }
  else if (label === 'This Year') { start.setMonth(0, 1); }
  else { start.setDate(1); }
  return { start, end };
}
export function getBudgetRange(period: BudgetPeriod, now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  if (period === 'weekly') { const day = start.getDay() || 7; start.setDate(start.getDate() - day + 1); end.setDate(start.getDate() + 6); }
  else if (period === 'yearly') { start.setMonth(0, 1); end.setMonth(11, 31); }
  else { start.setDate(1); end.setMonth(end.getMonth() + 1, 0); }
  return { start, end };
}
export function filterTransactionsByRange(items: Transaction[], range: { start: Date; end: Date }) {
  return items.filter(t => { const d = new Date(t.transactionDate); return d >= range.start && d <= range.end; });
}
export function isThisWeek(d: string) { return filterTransactionsByRange([{ transactionDate: d } as Transaction], getRangeForLabel('This Week')).length > 0; }
export function isThisMonth(d: string) { return filterTransactionsByRange([{ transactionDate: d } as Transaction], getRangeForLabel('This Month')).length > 0; }
export function isThisYear(d: string) { return filterTransactionsByRange([{ transactionDate: d } as Transaction], getRangeForLabel('This Year')).length > 0; }

export function computeMonthlyData(items: Transaction[]): { month: string; income: number; expenses: number }[] {
  const now = new Date(); const result: Record<string, { month: string; income: number; expenses: number }> = {};
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const key = `${d.getFullYear()}-${d.getMonth()}`; result[key] = { month: getMonthShort(d.getMonth() + 1), income: 0, expenses: 0 }; }
  items.forEach(t => { const d = new Date(t.transactionDate); const key = `${d.getFullYear()}-${d.getMonth()}`; if (!result[key]) return; if (t.type === 'credit') result[key].income += t.amount; else if (t.type === 'debit') result[key].expenses += t.amount; });
  return Object.values(result);
}
export function computeTopMerchants(items: Transaction[]) {
  const map: Record<string, { name: string; category: string; amount: number; txnCount: number }> = {};
  items.filter(t => t.type === 'debit').forEach(t => { const name = t.vendor || t.title || 'Unknown'; map[name] = map[name] ? { ...map[name], amount: map[name].amount + t.amount, txnCount: map[name].txnCount + 1 } : { name, category: t.category || 'Other', amount: t.amount, txnCount: 1 }; });
  return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 5);
}
export function computeBalanceSpots(items: Transaction[]) {
  const now = new Date(); const totals: number[] = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); totals.push(items.filter(t => { const x = new Date(t.transactionDate); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }).reduce((s, t) => s + (t.type === 'credit' ? t.amount : t.type === 'debit' ? -t.amount : 0), 0)); }
  let cumulative = 0; return totals.map((v, i) => ({ x: i, y: (cumulative += v) }));
}
export function getCategoryColor(category: string) { return ({ 'Food & Dining': '#FF7A59', Transport: '#3B82F6', Utilities: '#14B8A6', Health: '#EF4444', Education: '#8B5CF6', Entertainment: '#EC4899', Shopping: '#F43F5E', Savings: '#10B981', Investment: '#6366F1', Salary: '#06B6D4', Business: '#F59E0B', Gifts: '#E879F9', Rent: '#A16207', Communication: '#0891B2', Other: '#94A3B8' } as Record<string, string>)[category] || '#94A3B8'; }
