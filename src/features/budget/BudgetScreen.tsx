import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Alert, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadBudgetsAsync, addBudgetAsync, deleteBudgetAsync } from './budgetSlice';
import { loadTransactionsAsync } from '../transactions/transactionsSlice';
import { formatGhs, formatCompact } from '../../utils/currency';
import { getDaysLeftInMonth, getCategoryColor, filterTransactionsByRange, getBudgetRange } from '../../utils/helpers';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { BudgetPeriod } from '../../models/types';
import ProgressBar from '../../components/ProgressBar';
import { colors, typography, shadows, radii } from '../../theme';

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
  const spentFor = (budget: typeof budgets[number]) => filterTransactionsByRange(transactions.filter(t => t.type === 'debit' && t.category === budget.category), { start: new Date(budget.startDate), end: new Date(budget.endDate) }).reduce((sum, t) => sum + t.amount, 0);
  const monthlySpending = transactions.filter(t => t.type === 'debit' && filterTransactionsByRange([t], getBudgetRange('monthly')).length > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + spentFor(b), 0);
  const utilization = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;
  const daysLeft = getDaysLeftInMonth();
  const dailyAvg = now.getDate() > 0 ? monthlySpending / now.getDate() : 0;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget Tracker</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
        >
          <Icon name="plus" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Header Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewMonth}>
              {monthNames[now.getMonth()]} {now.getFullYear()}
            </Text>
            <View style={styles.overviewBadge}>
              <Text style={styles.overviewBadgeText}>{Math.round(utilization * 100)}% used</Text>
            </View>
          </View>

          <Text style={styles.overviewSpent}>{formatGhs(totalSpent)}</Text>
          <Text style={styles.overviewOf}>
            {totalBudget > 0 ? `of ${formatGhs(totalBudget)} total budget` : 'No budget configured'}
          </Text>

          <ProgressBar
            progress={utilization}
            backgroundColor="rgba(255,255,255,0.2)"
            color={utilization > 0.9 ? '#DE350B' : utilization > 0.75 ? '#FF991F' : colors.accent}
            height={10}
            style={{ marginTop: 20 }}
          />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>{formatCompact(Math.max(totalBudget - totalSpent, 0))}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Daily Avg</Text>
              <Text style={styles.statValue}>{formatCompact(dailyAvg)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Days Left</Text>
              <Text style={styles.statValue}>{daysLeft} days</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Category Budgets</Text>

        {budgets.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBg}>
              <Icon name="wallet-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No budget limits set</Text>
            <Text style={styles.emptySubtitle}>Set up monthly limits for categories like Food or Transport</Text>
          </View>
        ) : (
          budgets.map((budget) => {
            const spent = spentFor(budget);
            const pct = budget.limitAmount > 0 ? Math.min(spent / budget.limitAmount, 1) : 0;
            const isOver = spent > budget.limitAmount;
            const isNear = pct > 0.8 && !isOver;
            const categoryColor = getCategoryColor(budget.category);

            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={[styles.budgetIconWrap, { backgroundColor: `${categoryColor}15` }]}>
                    <Icon name={getIconName(budget.category)} size={22} color={categoryColor} />
                  </View>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetName}>{budget.category}</Text>
                    <Text style={styles.budgetAmounts}>
                      {formatGhs(spent)} of {formatGhs(budget.limitAmount)}
                    </Text>
                  </View>
                  {isOver && (
                    <View style={styles.badgeRed}>
                      <Text style={styles.badgeRedText}>Over</Text>
                    </View>
                  )}
                  {isNear && (
                    <View style={styles.badgeOrange}>
                      <Text style={styles.badgeOrangeText}>Warning</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ padding: 6, marginLeft: 4 }}
                    onPress={() => {
                      Alert.alert(
                        'Delete Budget',
                        `Remove budget limit for ${budget.category}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => dispatch(deleteBudgetAsync(budget.id)),
                          },
                        ]
                      );
                    }}
                  >
                    <Icon name="trash-can-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <ProgressBar
                  progress={pct}
                  color={isOver ? colors.expense : isNear ? colors.warning : categoryColor}
                  height={8}
                  style={{ marginTop: 12 }}
                />

                <View style={styles.budgetFooter}>
                  <Text style={styles.budgetPct}>{Math.round(pct * 100)}% used</Text>
                  <Text style={[styles.budgetLeft, isOver && { color: colors.expense }]}>
                    {isOver ? 'Exceeded by ' : ''}{formatGhs(Math.abs(budget.limitAmount - spent))} {isOver ? '' : 'left'}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowCreate(true)}
      >
        <Icon name="plus" size={20} color={colors.textOnPrimary} />
        <Text style={styles.fabText}>New Budget</Text>
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
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Budget</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Select Category</Text>
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

          <Text style={styles.label}>Limit Amount (GH₵)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
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
            <Text style={styles.createBtnText}>{isSaving ? 'Saving...' : 'Save Budget'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  scrollContent: {
    padding: 16,
  },
  overviewCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: 22,
    ...shadows.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewMonth: {
    color: colors.textOnPrimaryMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  overviewBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  overviewBadgeText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  overviewSpent: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    marginTop: 12,
    letterSpacing: -1,
  },
  overviewOf: {
    color: colors.textOnPrimaryMuted,
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  statItem: {},
  statLabel: {
    color: colors.textOnPrimaryMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  statValue: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  budgetAmounts: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRed: {
    backgroundColor: colors.expenseSoft,
    borderRadius: radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeRedText: {
    color: colors.expense,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  badgeOrange: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeOrangeText: {
    color: colors.warning,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetPct: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  budgetLeft: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radii.full,
    ...shadows.lg,
  },
  fabText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceSubtle,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  categoryChipActive: {
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  periodBtnTextActive: {
    color: colors.textOnPrimary,
  },
  createBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
