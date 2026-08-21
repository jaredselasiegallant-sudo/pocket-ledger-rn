import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Budget, BudgetInput } from '../../models/types';
import { MMKV } from 'react-native-mmkv';
import { v4 as uuidv4 } from 'uuid';

const storage = new MMKV();

interface BudgetsState {
  items: Budget[];
  loading: boolean;
}

const initialState: BudgetsState = {
  items: [],
  loading: false,
};

function loadBudgets(): Budget[] {
  try {
    const raw = storage.getString('budgets');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveBudgets(items: Budget[]) {
  storage.set('budgets', JSON.stringify(items));
}

export const loadBudgetsAsync = createAsyncThunk('budgets/load', async () => {
  return loadBudgets();
});

export const addBudgetAsync = createAsyncThunk(
  'budgets/add',
  async (input: BudgetInput, { getState }) => {
    const now = new Date().toISOString();
    const budget: Budget = {
      id: Date.now(),
      uuid: uuidv4(),
      name: input.name,
      category: input.category,
      limitAmount: input.limitAmount,
      spentAmount: 0,
      currency: 'GHS',
      period: input.period,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const state = getState() as { budgets: BudgetsState };
    const updated = [...state.budgets.items, budget];
    saveBudgets(updated);
    return budget;
  }
);

export const deleteBudgetAsync = createAsyncThunk(
  'budgets/delete',
  async (id: number, { getState }) => {
    const state = getState() as { budgets: BudgetsState };
    const updated = state.budgets.items.map((b) =>
      b.id === id ? { ...b, isActive: false, updatedAt: new Date().toISOString() } : b
    );
    saveBudgets(updated.filter((b) => b.isActive));
    return id;
  }
);

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadBudgetsAsync.fulfilled, (state, action) => {
        state.items = action.payload.filter((b) => b.isActive);
        state.loading = false;
      })
      .addCase(loadBudgetsAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(addBudgetAsync.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(deleteBudgetAsync.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  },
});

export default budgetsSlice.reducer;
