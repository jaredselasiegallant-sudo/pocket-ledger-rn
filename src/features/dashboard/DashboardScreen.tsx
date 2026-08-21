import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadTransactionsAsync } from '../transactions/transactionsSlice';
import { loadAccountsAsync } from './accountsSlice';
import { loadBudgetsAsync } from '../budget/budgetSlice';
import { formatGhs, formatCompact } from '../../utils/currency';
import { getDateLabel } from '../../utils/helpers';
import { Transaction } from '../../models/types';

export default function DashboardScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((s) => s.transactions.items);
  const accounts = useAppSelector((s) => s.accounts.items);

  useEffect(() => {
    dispatch(loadTransactionsAsync());
    dispatch(loadAccountsAsync());
    dispatch(loadBudgetsAsync());
  }, [dispatch]);

  const totalBalance = accounts
    .filter((a) => a.isActive && a.includeInTotal)
    .reduce((sum, a) => sum + a.balance, 0);

  const now = new Date();
  const monthlyTxns = transactions.filter((t) => {
    const d = new Date(t.transactionDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = monthlyTxns
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthlyTxns
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTxns = transactions.slice(0, 10);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Header */}
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatGhs(totalBalance)}</Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceChip}>
              <View style={[styles.chipIcon, { backgroundColor: 'rgba(0,135,90,0.2)' }]}>
                <Text style={styles.chipIconText}>↓</Text>
              </View>
              <View style={styles.chipTextWrap}>
                <Text style={styles.chipLabel}>Income</Text>
                <Text style={styles.chipAmount}>{formatCompact(income)}</Text>
              </View>
            </View>
            <View style={styles.balanceChip}>
              <View style={[styles.chipIcon, { backgroundColor: 'rgba(222,53,11,0.2)' }]}>
                <Text style={styles.chipIconText}>↑</Text>
              </View>
              <View style={styles.chipTextWrap}>
                <Text style={styles.chipLabel}>Expenses</Text>
                <Text style={styles.chipAmount}>{formatCompact(expenses)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: '↗', label: 'Send', color: '#DE350B' },
            { icon: '↙', label: 'Receive', color: '#00875A' },
            { icon: '↔', label: 'Transfer', color: '#0065FF' },
            { icon: '📄', label: 'Pay Bill', color: '#FF991F' },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickActionBtn}
              onPress={() => navigation.navigate('Transactions', { screen: 'AddTransaction' })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E2E6DE' }]}>
                <Text style={{ fontSize: 20 }}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTxns.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first transaction</Text>
          </View>
        ) : (
          recentTxns.map((txn) => (
            <TransactionTile key={txn.id} transaction={txn} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Transactions', { screen: 'AddTransaction' })}
      >
        <Text style={styles.fabText}>+ Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

function TransactionTile({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === 'credit';
  const color = isCredit ? '#00875A' : '#DE350B';

  return (
    <View style={styles.txnTile}>
      <View style={[styles.txnIcon, { backgroundColor: `${color}15` }]}>
        <Text style={{ color, fontSize: 18 }}>{isCredit ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnTitle}>{transaction.title}</Text>
        <Text style={styles.txnCategory}>{transaction.category || 'Other'}</Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={[styles.txnAmount, { color }]}>
          {isCredit ? '+' : '-'}{formatGhs(transaction.amount)}
        </Text>
        <Text style={styles.txnDate}>{getDateLabel(transaction.transactionDate)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF5' },
  scrollContent: { paddingTop: 20 },
  balanceHeader: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: '#006B3F',
    borderRadius: 24,
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4, letterSpacing: -1 },
  balanceRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  balanceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chipTextWrap: { flex: 1 },
  chipLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
  chipAmount: { color: '#fff', fontSize: 14, fontWeight: '600' },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  quickActionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: '#717971' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1C19' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#006B3F' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#717971' },
  emptySubtitle: { fontSize: 14, color: 'rgba(113,121,113,0.6)', marginTop: 4 },
  txnTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  txnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: 16, fontWeight: '600', color: '#1A1C19' },
  txnCategory: { fontSize: 13, color: '#717971', marginTop: 2 },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 15, fontWeight: '600' },
  txnDate: { fontSize: 11, color: '#717971', marginTop: 2 },
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
});
