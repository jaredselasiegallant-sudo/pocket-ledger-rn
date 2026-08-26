import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Account } from '../../models/types';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
export interface AccountsState { items: Account[]; loading: boolean; }
const now = () => new Date().toISOString();
const defaultAccounts: Account[] = [
  ['MTN MoMo', 'mobile_money', 'MTN MoMo'], ['Telecel Cash', 'mobile_money', 'Telecel Cash'], ['AT Money', 'mobile_money', 'AT Money'], ['GCB Bank', 'bank', 'GCB'], ['Cash Wallet', 'cash', null],
].map(([name, type, provider], i) => ({ id: i + 1, uuid: String(i + 1), name: String(name), type: type as Account['type'], provider, balance: 0, currency: 'GHS', accountNumber: null, isActive: true, includeInTotal: true, createdAt: now(), updatedAt: now() }));
const initialState: AccountsState = { items: [], loading: false };
function save(items: Account[]) { storage.set('accounts', JSON.stringify(items)); }
function read() { try { const raw = storage.getString('accounts'); return raw ? JSON.parse(raw) as Account[] : []; } catch { return []; } }
export const loadAccountsAsync = createAsyncThunk('accounts/load', async () => { const items = read(); if (items.length) return items; save(defaultAccounts); return defaultAccounts; });
const accountsSlice = createSlice({
  name: 'accounts', initialState,
  reducers: {
    adjustBalances(state, action: PayloadAction<{ type: 'debit' | 'credit' | 'transfer'; amount: number; account?: string | null; fromAccount?: string | null; toAccount?: string | null }>) {
      const { type, amount, account, fromAccount, toAccount } = action.payload;
      state.items = state.items.map(a => {
        let delta = 0;
        if (type === 'credit' && a.name === account) delta = amount;
        if (type === 'debit' && a.name === account) delta = -amount;
        if (type === 'transfer') { if (a.name === fromAccount) delta = -amount; if (a.name === toAccount) delta = amount; }
        return delta ? { ...a, balance: a.balance + delta, updatedAt: now() } : a;
      });
      save(state.items);
    },
    resetAccounts(state) { state.items = []; state.loading = false; storage.delete('accounts'); },
  },
  extraReducers: builder => builder.addCase(loadAccountsAsync.pending, s => { s.loading = true; }).addCase(loadAccountsAsync.fulfilled, (s, a) => { s.items = a.payload; s.loading = false; }),
});
export const { adjustBalances, resetAccounts } = accountsSlice.actions;
export default accountsSlice.reducer;
