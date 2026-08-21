import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { loadTransactionsAsync } from '../transactions/transactionsSlice';
import { formatGhs, formatCompact } from '../../utils/currency';
import { computeMonthlyData, computeTopMerchants, computeBalanceSpots, getCategoryColor } from '../../utils/helpers';
import ProgressBar from '../../components/ProgressBar';
import { colors, typography, shadows, radii } from '../../theme';

const PERIODS = ['This Week', 'This Month', 'This Year'];

export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((s) => s.transactions.items);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  useEffect(() => {
    dispatch(loadTransactionsAsync());
  }, [dispatch]);

  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpenses;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
  const categoryData = Object.entries(categoryMap)
    .map(([name, total]) => ({ name, total, color: getCategoryColor(name) }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
  const categoryTotal = categoryData.reduce((s, d) => s + d.total, 0);

  const monthlyData = computeMonthlyData(transactions);
  const topMerchants = computeTopMerchants(transactions);
  const balanceSpots = computeBalanceSpots(transactions);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodChip, selectedPeriod === p && styles.periodChipActive]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIconBg, { backgroundColor: colors.incomeSoft }]}>
              <Icon name="arrow-bottom-left" size={14} color={colors.income} />
            </View>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>{formatCompact(totalIncome)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIconBg, { backgroundColor: colors.expenseSoft }]}>
              <Icon name="arrow-up-right" size={14} color={colors.expense} />
            </View>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>{formatCompact(totalExpenses)}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.summaryIconBg, { backgroundColor: colors.primarySoft }]}>
              <Icon name="piggy-bank-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Net Savings</Text>
            <Text style={[styles.summaryAmount, { color: colors.primary }]}>{formatCompact(savings)}</Text>
          </View>
        </View>

        {/* Spending by Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          {categoryData.length === 0 ? (
            <View style={styles.emptyChart}>
              <Icon name="chart-pie" size={32} color={colors.textMuted} />
              <Text style={styles.emptyChartText}>No spending recorded for this period</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              {categoryData.map((d) => {
                const pct = categoryTotal > 0 ? (d.total / categoryTotal) * 100 : 0;
                return (
                  <View key={d.name} style={styles.pieRow}>
                    <View style={[styles.pieDot, { backgroundColor: d.color }]} />
                    <Text style={styles.pieLabel}>{d.name}</Text>
                    <View style={styles.pieBarWrap}>
                      <ProgressBar progress={pct / 100} color={d.color} height={8} />
                    </View>
                    <Text style={styles.piePct}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Monthly Trend Bar Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>

          <View style={styles.barChart}>
            {monthlyData.map((d, i) => {
              const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expenses)), 1);
              const incHeight = (d.income / maxVal) * 110;
              const expHeight = (d.expenses / maxVal) * 110;
              return (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, { height: Math.max(incHeight, 4), backgroundColor: colors.primary }]} />
                    <View style={[styles.bar, { height: Math.max(expHeight, 4), backgroundColor: colors.expense }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Merchants Breakdown */}
        {topMerchants.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Vendors & Merchants</Text>
            <View style={{ marginTop: 12 }}>
              {topMerchants.map((m, i) => {
                const maxAmount = topMerchants[0].amount;
                const barWidth = maxAmount > 0 ? (m.amount / maxAmount) * 100 : 0;
                return (
                  <View key={i} style={styles.merchantRow}>
                    <View style={styles.merchantRank}>
                      <Text style={styles.merchantRankText}>#{i + 1}</Text>
                    </View>
                    <View style={styles.merchantInfo}>
                      <Text style={styles.merchantName}>{m.name}</Text>
                      <Text style={styles.merchantCat}>{m.category} • {m.txnCount} txns</Text>
                      <ProgressBar progress={barWidth / 100} color={colors.primary} height={4} style={{ marginTop: 6 }} />
                    </View>
                    <Text style={styles.merchantAmount}>{formatGhs(m.amount)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: colors.textOnPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  summaryIconBg: {
    width: 24,
    height: 24,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  summaryAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyChartText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  pieDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  pieLabel: {
    width: 110,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  pieBarWrap: {
    flex: 1,
  },
  piePct: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    width: 35,
    textAlign: 'right',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 16,
    gap: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 120,
  },
  bar: {
    width: 8,
    borderRadius: radii.full,
  },
  barLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 6,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  merchantRank: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantRankText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  merchantCat: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  merchantAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});
