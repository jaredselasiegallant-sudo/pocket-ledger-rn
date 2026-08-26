import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { TransactionInput } from '../models/types';

export interface DetectedTransaction {
  id: string;
  provider: 'MTN MoMo' | 'Telecel Cash' | string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  title: string;
  vendor?: string | null;
  reference?: string | null;
  account?: string | null;
  transactionDate: number;
  sourcePackage: string;
  rawText: string;
}

type NativeNotificationModule = {
  isNotificationAccessEnabled(): Promise<boolean>;
  openNotificationAccessSettings(): void;
  getPendingTransactions(): Promise<DetectedTransaction[]>;
  clearPendingTransactions(): void;
};

const nativeModule = NativeModules.PocketLedgerNotifications as NativeNotificationModule | undefined;
const emitter = Platform.OS === 'android' && nativeModule ? new NativeEventEmitter(nativeModule as never) : null;
export const NOTIFICATION_EVENT = 'PocketLedgerNotificationReceived';

export const notificationImporter = {
  isSupported: Platform.OS === 'android' && Boolean(nativeModule),
  async isEnabled() { return nativeModule ? nativeModule.isNotificationAccessEnabled() : false; },
  openSettings() { nativeModule?.openNotificationAccessSettings(); },
  async getPending() { return nativeModule ? nativeModule.getPendingTransactions() : []; },
  clearPending() { nativeModule?.clearPendingTransactions(); },
  subscribe(listener: (transaction: DetectedTransaction) => void) {
    return emitter?.addListener(NOTIFICATION_EVENT, listener) ?? { remove() {} };
  },
};

export function toTransactionInput(item: DetectedTransaction): TransactionInput {
  return {
    title: item.title || `${item.provider} transaction`,
    amount: item.amount,
    type: item.type,
    category: item.type === 'credit' ? 'Salary' : 'Other',
    vendor: item.vendor || undefined,
    reference: item.reference || undefined,
    provider: item.provider,
    account: item.account || undefined,
    transactionDate: new Date(item.transactionDate).toISOString(),
  };
}
