import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal, Alert, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { deleteTransactionAsync } from './transactionsSlice';
import { Transaction } from '../../models/types';
import TransactionTile from '../../components/TransactionTile';
import { colors, typography, shadows, radii } from '../../theme';
import { formatGhs } from '../../utils/currency';
import { getDateLabel } from '../../utils/helpers';

const FILTERS = ['All', 'Income', 'Expenses', 'Transfers'];
const PERIODS = ['Today', 'This Week', 'This Month', 'This Year'];

function filterToType(filter: string): string {
  switch (filter) {
    case 'Income': return 'credit';
    case 'Expenses': return 'debit';
    case 'Transfers': return 'transfer';
    default: return '';
  }
}

export default function TransactionListScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((s) => s.transactions.items);

  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return transactions.filter((txn) => {
      const d = new Date(txn.transactionDate);
      const txnDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      switch (selectedPeriod) {
        case 'Today':
          if (txnDay.getTime() !== today.getTime()) return false;
          break;
        case 'This Week': {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1));
          if (txnDay < weekStart) return false;
          break;
        }
        case 'This Month':
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
          break;
        case 'This Year':
          if (d.getFullYear() !== now.getFullYear()) return false;
          break;
      }

      const type = filterToType(selectedFilter);
      if (type && txn.type !== type) return false;

      if (isSearching && searchText) {
        const q = searchText.toLowerCase();
        if (!txn.title.toLowerCase().includes(q) && !(txn.category || '').toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedFilter, selectedPeriod, searchText, isSearching]);

  const totalIncome = filtered
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const handleDeleteTxn = (id: number) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dispatch(deleteTransactionAsync(id));
            setSelectedTxn(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={styles.searchBarWrap}>
            <Icon name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>Transactions</Text>
        )}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchText('');
          }}
        >
          <Icon name={isSearching ? 'close' : 'magnify'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View>
        <FlatList
          horizontal
          data={PERIODS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.periodChip, selectedPeriod === item && styles.periodChipActive]}
              onPress={() => setSelectedPeriod(item)}
            >
              <Text
                style={[
                  styles.periodChipText,
                  selectedPeriod === item && styles.periodChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <SummaryCard label="Income" amount={totalIncome} color={colors.income} icon="arrow-bottom-left" />
        <SummaryCard label="Expenses" amount={totalExpenses} color={colors.expense} icon="arrow-up-right" />
        <SummaryCard label="Net Total" amount={netBalance} color={colors.primary} icon="scale-balance" />
      </View>

      {/* Filter Chips */}
      <View>
        <FlatList
          horizontal
          data={FILTERS}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === item && styles.filterChipActive]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <Icon name="text-box-search-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No matching transactions</Text>
          <Text style={styles.emptySubtitle}>
            {selectedFilter !== 'All' ? 'Try adjusting your filters' : 'Tap + to log your first transaction'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionTile
              transaction={item}
              onPress={() => setSelectedTxn(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Icon name="plus" size={24} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Transaction Detail & Delete Modal */}
      {selectedTxn && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Transaction Details</Text>
                <TouchableOpacity onPress={() => setSelectedTxn(null)}>
                  <Icon name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailAmountCard}>
                <Text style={[
                  styles.detailAmount,
                  { color: selectedTxn.type === 'credit' ? colors.income : colors.expense }
                ]}>
                  {selectedTxn.type === 'credit' ? '+' : '-'}{formatGhs(selectedTxn.amount)}
                </Text>
                <Text style={styles.detailTitle}>{selectedTxn.title}</Text>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailVal}>
                    {selectedTxn.type === 'credit' ? 'Income' : selectedTxn.type === 'debit' ? 'Expense' : 'Transfer'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailVal}>{selectedTxn.category || 'Other'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account</Text>
                  <Text style={styles.detailVal}>{selectedTxn.account || 'Main Wallet'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailVal}>{getDateLabel(selectedTxn.transactionDate)}</Text>
                </View>

                {selectedTxn.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailVal}>{selectedTxn.description}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteTxn(selectedTxn.id)}
              >
                <Icon name="trash-can-outline" size={20} color={colors.textOnPrimary} />
                <Text style={styles.deleteBtnText}>Delete Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function SummaryCard({ label, amount, color, icon }: { label: string; amount: number; color: string; icon: string }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIconBg, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={14} color={color} />
        </View>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryAmount, { color }]}>{formatGhs(amount)}</Text>
    </View>
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
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    paddingVertical: 10,
    marginLeft: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  periodList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  periodChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  periodChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  periodChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryIconBg: {
    width: 22,
    height: 22,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  summaryAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    marginTop: 6,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  detailAmountCard: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    marginBottom: 20,
  },
  detailAmount: {
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
  },
  detailTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  detailGrid: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
  },
  detailVal: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.expense,
    borderRadius: radii.lg,
    paddingVertical: 14,
  },
  deleteBtnText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
