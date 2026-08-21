import { DEFAULT_CURRENCY_SYMBOL } from './constants';

export function formatGhs(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(abs / 1000000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${abs.toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${DEFAULT_CURRENCY_SYMBOL}${abs.toFixed(2)}`;
}

export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1000000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(abs / 1000000).toFixed(1)}M`;
  }
  if (abs >= 1000) {
    return `${DEFAULT_CURRENCY_SYMBOL}${(abs / 1000).toFixed(1)}K`;
  }
  return `${DEFAULT_CURRENCY_SYMBOL}${abs.toFixed(0)}`;
}

export function formatCurrency(amount: number, symbol: string = DEFAULT_CURRENCY_SYMBOL): string {
  return `${symbol}${Math.abs(amount).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
