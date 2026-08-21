import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { loadTransactionsAsync } from '../transactions/transactionsSlice';
import { loadAccountsAsync } from './accountsSlice';
import { loadBudgetsAsync } from '../budget/budgetSlice';
import HeaderCard from '../../components/HeaderCard';
import QuickActionButton from '../../components/QuickActionButton';
import TransactionTile from '../../components/TransactionTile';
import { colors, typography, shadows, radii } from '../../theme';

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Top Header Title */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>Akwaaba 👋</Text>
          <Text style={styles.appTitle}>Pocket Ledger</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="cog-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Total Balance Card */}
        <HeaderCard
          totalBalance={totalBalance}
          income={income}
          expenses={expenses}
        />

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <QuickActionButton
            icon="arrow-top-right"
            label="Send"
            badgeColor={colors.expenseSoft}
            iconColor={colors.expense}
            onPress={() => navigation.navigate('AddTransaction', { initialType: 'debit' })}
          />
          <QuickActionButton
            icon="arrow-bottom-left"
            label="Receive"
            badgeColor={colors.incomeSoft}
            iconColor={colors.income}
            onPress={() => navigation.navigate('AddTransaction', { initialType: 'credit' })}
          />
          <QuickActionButton
            icon="swap-horizontal"
            label="Transfer"
            badgeColor={colors.infoSoft}
            iconColor={colors.info}
            onPress={() => navigation.navigate('AddTransaction', { initialType: 'transfer' })}
          />
          <QuickActionButton
            icon="file-document-outline"
            label="Pay Bill"
            badgeColor={colors.warningSoft}
            iconColor={colors.warning}
            onPress={() => navigation.navigate('AddTransaction', { initialType: 'debit', initialCategory: 'Utilities' })}
          />
        </View>

        {/* Recent Transactions Section */}
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
            <View style={styles.emptyIconBg}>
              <Icon name="receipt-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No transactions recorded</Text>
            <Text style={styles.emptySubtitle}>Tap the button below to add your first entry</Text>
          </View>
        ) : (
          recentTxns.map((txn) => (
            <TransactionTile
              key={txn.id}
              transaction={txn}
              onPress={() => navigation.navigate('Transactions')}
            />
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Icon name="plus" size={20} color={colors.textOnPrimary} />
        <Text style={styles.fabText}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  notificationBtn: {
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
    paddingTop: 8,
  },
  quickActionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: radii.xl,
    paddingVertical: 36,
    paddingHorizontal: 20,
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
});
