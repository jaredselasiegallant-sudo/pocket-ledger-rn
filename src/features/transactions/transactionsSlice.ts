import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, TransactionInput } from '../../models/types';
import { MMKV } from 'react-native-mmkv';
import { v4 as uuidv4 } from 'uuid';

const storage = new MMKV();

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
};

function loadTransactions(): Transaction[] {
  try {
    const raw = storage.getString('transactions');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveTransactions(items: Transaction[]) {
  storage.set('transactions', JSON.stringify(items));
}

export const loadTransactionsAsync = createAsyncThunk(
  'transactions/load',
  async () => {
    return loadTransactions();
  }
);

export const addTransactionAsync = createAsyncThunk(
  'transactions/add',
  async (input: TransactionInput, { getState }) => {
    const now = new Date().toISOString();
    const txn: Transaction = {
      id: Date.now(),
      uuid: uuidv4(),
      title: input.title,
      description: input.description || null,
      amount: input.amount,
      currency: 'GHS',
      type: input.type,
      category: input.category,
      vendor: input.vendor || null,
      reference: input.reference || null,
      provider: input.provider || null,
      account: input.account || null,
      isAutoCaptured: false,
      isRecurring: input.isRecurring || false,
      recurringFrequency: null,
      transactionDate: input.transactionDate || now,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    const state = getState() as { transactions: TransactionsState };
    const updated = [txn, ...state.transactions.items];
    saveTransactions(updated);
    return txn;
  }
);

export const deleteTransactionAsync = createAsyncThunk(
  'transactions/delete',
  async (id: number, { getState }) => {
    const state = getState() as { transactions: TransactionsState };
    const updated = state.transactions.items.map((t) =>
      t.id === id ? { ...t, isDeleted: true, updatedAt: new Date().toISOString() } : t
    );
    saveTransactions(updated.filter((t) => !t.isDeleted));
    return id;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadTransactionsAsync.fulfilled, (state, action) => {
        state.items = action.payload.filter((t) => !t.isDeleted);
        state.loading = false;
      })
      .addCase(loadTransactionsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(addTransactionAsync.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteTransactionAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      });
  },
});

export default transactionsSlice.reducer;
