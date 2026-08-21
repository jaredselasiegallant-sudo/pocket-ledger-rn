import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadBudgetsAsync, addBudgetAsync } from './budgetSlice';
import { loadTransactionsAsync } from '../transactions/transactionsSlice';
import { formatGhs, formatCompact } from '../../utils/currency';
import { getDaysLeftInMonth, getCategoryColor } from '../../utils/helpers';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { BudgetPeriod } from '../../models/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function BudgetScreen() {
  const dispatch = useAppDispatch();
  const budgets = useAppSelector((s) => s.budgets.items);
  const transactions = useAppSelector((s) => s.transactions.items);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    dispatch(loadBudgetsAsync());
    dispatch(loadTransactionsAsync());
  }, [dispatch]);

  const now = new Date();
  const monthlySpending = transactions
    .filter((t) => t.type === 'debit' && new Date(t.transactionDate).getMonth() === now.getMonth() && new Date(t.transactionDate).getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
  const utilization = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
  const daysLeft = getDaysLeftInMonth();
  const dailyAvg = now.day > 0 ? monthlySpent / now.getDate() : 0;

  const spendingByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'debit' && new Date(t.transactionDate).getMonth() === now.getMonth())
    .forEach((t) => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
    });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Icon name="plus" size={24} color="#006B3F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Monthly Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewMonth}>
              {['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()]} {now.getFullYear()} Budget
            </Text>
            <View style={styles.overviewBadge}>
              <Text style={styles.overviewBadgeText}>{Math.round(utilization * 100)}% used</Text>
            </View>
          </View>

          <Text style={styles.overviewSpent}>{formatGhs(totalSpent)}</Text>
          <Text style={styles.overviewOf}>
            {totalBudget > 0 ? `of ${formatGhs(totalBudget)} budget` : 'No budget set'}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${utilization * 100}%`,
                  backgroundColor: utilization > 0.9 ? '#DE350B' : utilization > 0.7 ? '#FF991F' : '#fff',
                },
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>{formatCompact(Math.max(totalBudget - totalSpent, 0))}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Daily Average</Text>
              <Text style={styles.statValue}>{formatCompact(dailyAvg)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Days Left</Text>
              <Text style={styles.statValue}>{daysLeft}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Category Budgets</Text>

        {budgets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon name="wallet" size={48} color="rgba(113,121,113,0.3)" />
            <Text style={styles.emptyTitle}>No budgets yet</Text>
            <Text style={styles.emptySubtitle}>Create a budget to track your spending</Text>
          </View>
        ) : (
          budgets.map((budget) => {
            const spent = spendingByCategory[budget.category] || budget.spentAmount;
            const pct = budget.limitAmount > 0 ? Math.min(spent / budget.limitAmount, 1) : 0;
            const isOver = spent > budget.limitAmount;
            const isNear = pct > 0.8 && !isOver;
            const color = getCategoryColor(budget.category);

            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={[styles.budgetIconWrap, { backgroundColor: `${color}15` }]}>
                    <Icon name={getIconName(budget.category)} size={22} color={color} />
                  </View>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{budget.category}</Text>
                    <Text style={styles.budgetAmounts}>
                      {formatGhs(spent)} of {formatGhs(budget.limitAmount)}
                    </Text>
                  </View>
                  {isOver && (
                    <View style={styles.badgeRed}>
                      <Text style={styles.badgeRedText}>Over Budget</Text>
                    </View>
                  )}
                  {isNear && (
                    <View style={styles.badgeOrange}>
                      <Text style={styles.badgeOrangeText}>Almost Full</Text>
                    </View>
                  )}
                </View>

                <View style={styles.budgetProgress}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${pct * 100}%`,
                        backgroundColor: isOver ? '#DE350B' : isNear ? '#FF991F' : color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.budgetFooter}>
                  <Text style={styles.budgetPct}>{Math.round(pct * 100)}% used</Text>
                  <Text style={[styles.budgetLeft, isOver && { color: '#DE350B' }]}>
                    {formatGhs(Math.max(budget.limitAmount - spent, 0))} left
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Text style={styles.fabText}>+ New Budget</Text>
      </TouchableOpacity>

      {/* Create Budget Modal */}
      <CreateBudgetModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        dispatch={dispatch}
      />
    </View>
  );
}

function getIconName(category: string): string {
  const map: Record<string, string> = {
    'Food & Dining': 'silverware-fork-knife',
    Transport: 'car',
    Utilities: 'flash',
    Health: 'hospital-box',
    Education: 'school',
    Entertainment: 'movie-open',
    Shopping: 'shopping',
    Communication: 'phone',
    Savings: 'piggy-bank',
    Investment: 'trending-up',
  };
  return map[category] || 'folder';
}

function CreateBudgetModal({ visible, onClose, dispatch }: { visible: boolean; onClose: () => void; dispatch: any }) {
  const [category, setCategory] = useState('Food & Dining');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      let startDate: string, endDate: string;

      switch (period) {
        case 'weekly': {
          const d = new Date(now);
          d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
          startDate = d.toISOString();
          const end = new Date(d);
          end.setDate(end.getDate() + 6);
          endDate = end.toISOString();
          break;
        }
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          endDate = new Date(now.getFullYear(), 11, 31).toISOString();
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      }

      await dispatch(
        addBudgetAsync({
          name: category,
          category,
          limitAmount: parsed,
          period,
          startDate,
          endDate,
        })
      ).unwrap();

      onClose();
    } catch {
      Alert.alert('Error', 'Failed to create budget');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Create Budget</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {DEFAULT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Budget Amount (GH₵)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#717971"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Period</Text>
          <View style={styles.periodRow}>
            {(['weekly', 'monthly', 'yearly'] as BudgetPeriod[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreate}
            disabled={isSaving}
          >
            <Text style={styles.createBtnText}>{isSaving ? '...' : 'Create Budget'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#1A1C19' },
  scrollContent: { padding: 16 },
  overviewCard: {
    backgroundColor: '#006B3F',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewMonth: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  overviewBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overviewBadgeText: { color: '#fff', fontSize: 11, fontWeight: '500' },
  overviewSpent: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 16, letterSpacing: -1 },
  overviewOf: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 8 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
  statItem: {},
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1C19', marginTop: 24, marginBottom: 12 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#717971', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: 'rgba(113,121,113,0.6)', marginTop: 4 },
  budgetCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  budgetInfo: { flex: 1 },
  budgetName: { fontSize: 16, fontWeight: '600', color: '#1A1C19' },
  budgetAmounts: { fontSize: 13, color: '#717971', marginTop: 2 },
  badgeRed: { backgroundColor: 'rgba(222,53,11,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeRedText: { color: '#DE350B', fontSize: 11, fontWeight: '700' },
  badgeOrange: { backgroundColor: 'rgba(255,153,31,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeOrangeText: { color: '#FF991F', fontSize: 11, fontWeight: '700' },
  budgetProgress: {
    height: 8,
    backgroundColor: '#ECF0E8',
    borderRadius: 6,
    marginTop: 12,
    overflow: 'hidden',
  },
  budgetProgressFill: { height: '100%', borderRadius: 6 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetPct: { fontSize: 11, color: '#717971' },
  budgetLeft: { fontSize: 11, color: '#717971' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#006B3F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8FAF5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(113,121,113,0.3)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '600', color: '#1A1C19', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#717971', marginBottom: 8 },
  input: {
    backgroundColor: '#E2E6DE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1C19',
    marginBottom: 16,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ECF0E8',
  },
  categoryChipActive: { backgroundColor: '#A4F5BA' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#717971' },
  chipTextActive: { color: '#006B3F', fontWeight: '700' },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ECF0E8',
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: '#006B3F' },
  periodBtnText: { fontSize: 14, fontWeight: '600', color: '#717971' },
  periodBtnTextActive: { color: '#fff' },
  createBtn: {
    height: 52,
    backgroundColor: '#006B3F',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
