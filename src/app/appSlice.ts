import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MMKV } from 'react-native-mmkv';
import { ThemeMode } from '../models/types';

const storage = new MMKV();
interface AppState { themeMode: ThemeMode; currency: string; }
const initialState: AppState = {
  themeMode: (storage.getString('themeMode') as ThemeMode) || 'light',
  currency: storage.getString('currency') || 'GHS',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      storage.set('themeMode', action.payload);
    },
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload;
      storage.set('currency', action.payload);
    },
    resetPreferences(state) {
      state.themeMode = 'light';
      state.currency = 'GHS';
      storage.delete('themeMode');
      storage.delete('currency');
    },
  },
});

export const { setThemeMode, setCurrency, resetPreferences } = appSlice.actions;
export default appSlice.reducer;
