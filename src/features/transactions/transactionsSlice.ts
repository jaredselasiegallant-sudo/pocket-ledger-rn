import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { MMKV } from 'react-native-mmkv';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionInput } from '../../models/types';
import { adjustBalances } from '../dashboard/accountsSlice';

const storage = new MMKV();
interface TransactionsState { items: Transaction[]; loading: boolean; error: string | null; }
const initialState: TransactionsState = { items: [], loading: false, error: null };
function normalize(t: Partial<Transaction>): Transaction { return { id: t.id ?? Date.now(), uuid: t.uuid ?? uuidv4(), title: t.title ?? 'Untitled transaction', description: t.description ?? null, amount: Number(t.amount ?? 0), currency: t.currency ?? 'GHS', type: t.type ?? 'debit', category: t.category ?? 'Other', vendor: t.vendor ?? null, reference: t.reference ?? null, provider: t.provider ?? null, account: t.account ?? null, fromAccount: t.fromAccount ?? null, toAccount: t.toAccount ?? null, isAutoCaptured: Boolean(t.isAutoCaptured), isRecurring: Boolean(t.isRecurring), recurringFrequency: t.recurringFrequency ?? null, transactionDate: t.transactionDate ?? new Date().toISOString(), createdAt: t.createdAt ?? new Date().toISOString(), updatedAt: t.updatedAt ?? new Date().toISOString(), isDeleted: Boolean(t.isDeleted) }; }
function read() { try { const raw = storage.getString('transactions'); return raw ? (JSON.parse(raw) as Partial<Transaction>[]).map(normalize) : []; } catch { return []; } }
function save(items: Transaction[]) { storage.set('transactions', JSON.stringify(items)); }
export const loadTransactionsAsync = createAsyncThunk('transactions/load', async () => read().filter(t => !t.isDeleted));
export const addTransactionAsync = createAsyncThunk('transactions/add', async (input: TransactionInput, { getState, dispatch, rejectWithValue }) => {
  if (input.amount <= 0 || !Number.isFinite(input.amount)) return rejectWithValue('Amount must be greater than zero');
  if (input.type === 'transfer' && (!input.fromAccount || !input.toAccount || input.fromAccount === input.toAccount)) return rejectWithValue('A transfer needs two different accounts');
  const now = new Date().toISOString();
  const txn = normalize({ ...input, id: Date.now(), uuid: uuidv4(), description: input.description || null, vendor: input.vendor || null, account: input.account || null, fromAccount: input.fromAccount || null, toAccount: input.toAccount || null, currency: 'GHS', createdAt: now, updatedAt: now, isDeleted: false });
  const state = getState() as { transactions: TransactionsState };
  save([txn, ...state.transactions.items]);
  dispatch(adjustBalances({ type: txn.type === 'credit' ? 'credit' : txn.type === 'debit' ? 'debit' : 'transfer', amount: txn.amount, account: txn.account, fromAccount: txn.fromAccount, toAccount: txn.toAccount }));
  return txn;
});
export const deleteTransactionAsync = createAsyncThunk('transactions/delete', async (id: number, { getState, dispatch }) => {
  const state = getState() as { transactions: TransactionsState };
  const txn = state.transactions.items.find(t => t.id === id);
  if (txn) dispatch(adjustBalances({ type: txn.type === 'credit' ? 'debit' : txn.type === 'debit' ? 'credit' : 'transfer', amount: txn.amount, account: txn.account, fromAccount: txn.toAccount, toAccount: txn.fromAccount }));
  const updated = state.transactions.items.filter(t => t.id !== id); save(updated); return id;
});
const slice = createSlice({ name: 'transactions', initialState, reducers: {}, extraReducers: builder => builder
  .addCase(loadTransactionsAsync.pending, s => { s.loading = true; s.error = null; })
  .addCase(loadTransactionsAsync.fulfilled, (s, a) => { s.items = a.payload; s.loading = false; })
  .addCase(loadTransactionsAsync.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Unable to load transactions'; })
  .addCase(addTransactionAsync.fulfilled, (s, a) => { s.items.unshift(a.payload); })
  .addCase(addTransactionAsync.rejected, (s, a) => { s.error = String(a.payload || a.error.message || 'Unable to save transaction'); })
  .addCase(deleteTransactionAsync.fulfilled, (s, a) => { s.items = s.items.filter(t => t.id !== a.payload); }) });
export default slice.reducer;
