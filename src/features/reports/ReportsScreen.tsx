import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAppSelector } from '../../app/hooks';
import { loadTransactionsAsync } from '../transactions/transactionsSlice';
import { useAppDispatch } from '../../app/hooks';
import { formatGhs, formatCompact } from '../../utils/currency';
import { computeMonthlyData, computeTopMerchants, computeBalanceSpots, getCategoryColor } from '../../utils/helpers';
import { Transaction } from '../../models/types';

const PERIODS = ['This Week', 'This Month', 'This Year'];

export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((s) => s.transactions.items);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  useEffect(() => {
    dispatch(loadTransactionsAsync());
  }, [dispatch]);

  const now = new Date();
  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);
  const savings = totalIncome - totalExpenses;

  // Spending by category
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <View
              key={p}
              style={[styles.periodChip, selectedPeriod === p && styles.periodChipActive]}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#00875A12' }]}>
            <Text style={[styles.summaryLabel, { color: '#00875A' }]}>Income</Text>
            <Text style={[styles.summaryAmount, { color: '#00875A' }]}>{formatCompact(totalIncome)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#DE350B12' }]}>
            <Text style={[styles.summaryLabel, { color: '#DE350B' }]}>Expenses</Text>
            <Text style={[styles.summaryAmount, { color: '#DE350B' }]}>{formatCompact(totalExpenses)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#00C85312' }]}>
            <Text style={[styles.summaryLabel, { color: '#00C853' }]}>Savings</Text>
            <Text style={[styles.summaryAmount, { color: '#00C853' }]}>{formatCompact(savings)}</Text>
          </View>
        </View>

        {/* Pie Chart (Simple) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          {categoryData.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>No spending data yet</Text>
            </View>
          ) : (
            <View>
              {categoryData.map((d) => {
                const pct = categoryTotal > 0 ? (d.total / categoryTotal) * 100 : 0;
                return (
                  <View key={d.name} style={styles.pieRow}>
                    <View style={[styles.pieDot, { backgroundColor: d.color }]} />
                    <Text style={styles.pieLabel}>{d.name}</Text>
                    <View style={styles.pieBarWrap}>
                      <View style={[styles.pieBar, { width: `${pct}%`, backgroundColor: d.color }]} />
                    </View>
                    <Text style={styles.piePct}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bar Chart (Simple) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#006B3F' }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DE350B' }]} />
                <Text style={styles.legendText}>Expenses</Text>
              </View>
            </View>
          </View>

          <View style={styles.barChart}>
            {monthlyData.map((d, i) => {
              const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expenses)), 1);
              const incHeight = (d.income / maxVal) * 120;
              const expHeight = (d.expenses / maxVal) * 120;
              return (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    <View style={[styles.bar, { height: incHeight, backgroundColor: '#006B3F' }]} />
                    <View style={[styles.bar, { height: expHeight, backgroundColor: '#DE350B' }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Line Chart (Simple) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Balance Over Time</Text>
          <View style={styles.lineChart}>
            {balanceSpots.map((spot, i) => {
              const maxAbs = Math.max(...balanceSpots.map((s) => Math.abs(s.y)), 1);
              const normalized = spot.y / maxAbs;
              return (
                <View key={i} style={styles.lineGroup}>
                  <View
                    style={[
                      styles.lineDot,
                      {
                        backgroundColor: normalized >= 0 ? '#006B3F' : '#DE350B',
                        bottom: `${(normalized + 1) * 40}%`,
                      },
                    ]}
                  />
                  <Text style={styles.lineLabel}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Spending */}
        {topMerchants.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Spending</Text>
            {topMerchants.map((m, i) => {
              const maxAmount = topMerchants[0].amount;
              const barWidth = maxAmount > 0 ? (m.amount / maxAmount) * 100 : 0;
              return (
                <View key={i} style={styles.merchantRow}>
                  <View style={styles.merchantRank}>
                    <Text style={styles.merchantRankText}>{i + 1}</Text>
                  </View>
                  <View style={styles.merchantInfo}>
                    <Text style={styles.merchantName}>{m.name}</Text>
                    <Text style={styles.merchantCat}>{m.category} · {m.txnCount} txns</Text>
                    <View style={styles.merchantBar}>
                      <View style={[styles.merchantBarFill, { width: `${barWidth}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.merchantAmount}>{formatGhs(m.amount)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#1A1C19' },
  scrollContent: { padding: 16 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ECF0E8',
    alignItems: 'center',
  },
  periodChipActive: { backgroundColor: '#006B3F' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#717971' },
  periodTextActive: { color: '#fff' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 14 },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  summaryAmount: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1C19' },
  emptyChart: { height: 120, alignItems: 'center', justifyContent: 'center' },
  emptyChartText: { color: '#717971', fontSize: 14 },
  pieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  pieDot: { width: 10, height: 10, borderRadius: 3 },
  pieLabel: { flex: 1, fontSize: 13, color: '#717971' },
  pieBarWrap: { width: 80, height: 8, backgroundColor: '#ECF0E8', borderRadius: 4, overflow: 'hidden' },
  pieBar: { height: '100%', borderRadius: 4 },
  piePct: { fontSize: 12, fontWeight: '600', color: '#1A1C19', width: 35, textAlign: 'right' },
  legendRow: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 11, color: '#717971' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 160, paddingTop: 16, gap: 4 },
  barGroup: { flex: 1, alignItems: 'center' },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 130 },
  bar: { width: 10, borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 11, color: '#717971', marginTop: 6 },
  lineChart: { height: 160, position: 'relative', marginTop: 16 },
  lineGroup: { position: 'absolute', width: '16.66%', alignItems: 'center' },
  lineDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute' },
  lineLabel: { position: 'absolute', bottom: 0, fontSize: 11, color: '#717971' },
  merchantRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  merchantRank: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#A4F5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantRankText: { fontSize: 14, fontWeight: '700', color: '#006B3F' },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 14, fontWeight: '600', color: '#1A1C19' },
  merchantCat: { fontSize: 12, color: '#717971', marginTop: 2 },
  merchantBar: { height: 6, backgroundColor: '#ECF0E8', borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  merchantBarFill: { height: '100%', backgroundColor: '#006B3F', borderRadius: 3 },
  merchantAmount: { fontSize: 14, fontWeight: '600', color: '#1A1C19' },
});
