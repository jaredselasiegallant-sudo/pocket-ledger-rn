import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Account } from '../../models/types';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface AccountsState {
  items: Account[];
  loading: boolean;
}

const defaultAccounts: Account[] = [
  { id: 1, uuid: '1', name: 'MTN MoMo', type: 'mobile_money', provider: 'MTN MoMo', balance: 0, currency: 'GHS', accountNumber: null, isActive: true, includeInTotal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, uuid: '2', name: 'Telecel Cash', type: 'mobile_money', provider: 'Telecel Cash', balance: 0, currency: 'GHS', accountNumber: null, isActive: true, includeInTotal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, uuid: '3', name: 'AT Money', type: 'mobile_money', provider: 'AT Money', balance: 0, currency: 'GHS', accountNumber: null, isActive: true, includeInTotal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, uuid: '4', name: 'GCB Bank', type: 'bank', provider: 'GCB', balance: 0, currency: 'GHS', accountNumber: null, isActive: true, includeInTotal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 5, uuid: '5', name: 'Cash Wallet', type: 'cash', provider: null, balance: 0, currency: 'GHS', accountNumber: null, isActive: true, includeInTotal: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialState: AccountsState = {
  items: [],
  loading: false,
};

function loadAccounts(): Account[] {
  try {
    const raw = storage.getString('accounts');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveAccounts(items: Account[]) {
  storage.set('accounts', JSON.stringify(items));
}

export const loadAccountsAsync = createAsyncThunk('accounts/load', async () => {
  let accounts = loadAccounts();
  if (accounts.length === 0) {
    accounts = defaultAccounts;
    saveAccounts(accounts);
  }
  return accounts;
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadAccountsAsync.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(loadAccountsAsync.pending, (state) => {
        state.loading = true;
      });
  },
});

export default accountsSlice.reducer;
