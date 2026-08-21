import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../models/types';

interface AppState {
  themeMode: ThemeMode;
  currency: string;
}

const initialState: AppState = {
  themeMode: 'system',
  currency: 'GHS',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setCurrency(state, action: PayloadAction<string>) {
      state.currency = action.payload;
    },
  },
});

export const { setThemeMode, setCurrency } = appSlice.actions;
export default appSlice.reducer;
