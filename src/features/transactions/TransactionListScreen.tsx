import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { useAppSelector } from '../../app/hooks';
import { Transaction } from '../../models/types';
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

export default function TransactionListScreen({ navigation, route }: any) {
  const transactions = useAppSelector((s) => s.transactions.items);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

  const totalIncome = transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;

  const renderItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'credit';
    const color = isCredit ? '#00875A' : '#DE350B';
    return (
      <View style={styles.txnTile}>
        <View style={[styles.txnIcon, { backgroundColor: `${color}15` }]}>
          <Text style={{ color, fontSize: 18 }}>{isCredit ? '↓' : '↑'}</Text>
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnTitle}>{item.title}</Text>
          <Text style={styles.txnCategory}>{item.category || 'Other'}</Text>
        </View>
        <View style={styles.txnRight}>
          <Text style={[styles.txnAmount, { color }]}>
            {isCredit ? '+' : '-'}{formatGhs(item.amount)}
          </Text>
          <Text style={styles.txnDate}>{getDateLabel(item.transactionDate)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isSearching ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#717971"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
        ) : (
          <Text style={styles.headerTitle}>Transactions</Text>
        )}
        <TouchableOpacity
          onPress={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchText('');
          }}
        >
          <Text style={styles.searchBtn}>{isSearching ? '✕' : '🔍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
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

      {/* Summary */}
      <View style={styles.summaryRow}>
        <SummaryCard label="Income" amount={totalIncome} color="#00875A" icon="↓" />
        <SummaryCard label="Expenses" amount={totalExpenses} color="#DE350B" icon="↑" />
        <SummaryCard label="Balance" amount={totalBalance} color="#006B3F" icon="💰" />
      </View>

      {/* Filter Chips */}
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

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedFilter !== 'All' ? 'Try changing your filter' : 'Add a transaction to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryCard({ label, amount, color, icon }: { label: string; amount: number; color: string; icon: string }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: `${color}12` }]}>
      <View style={styles.summaryHeader}>
        <Text style={{ color, fontSize: 14 }}>{icon}</Text>
        <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
      </View>
      <Text style={[styles.summaryAmount, { color }]}>{formatGhs(amount)}</Text>
    </View>
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1C19',
    paddingVertical: 8,
  },
  searchBtn: { fontSize: 20, padding: 8 },
  periodList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ECF0E8',
    borderWidth: 1,
    borderColor: '#C1C9BF',
  },
  periodChipActive: { backgroundColor: '#A4F5BA', borderColor: '#006B3F' },
  periodChipText: { fontSize: 13, fontWeight: '500', color: '#717971' },
  periodChipTextActive: { color: '#006B3F', fontWeight: '700' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  summaryCard: { flex: 1, padding: 12, borderRadius: 14 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  summaryAmount: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  filterList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ECF0E8',
    borderWidth: 1,
    borderColor: '#C1C9BF',
  },
  filterChipActive: { backgroundColor: '#A4F5BA', borderColor: '#006B3F' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#717971' },
  filterChipTextActive: { color: '#006B3F', fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  txnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006B3F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '600', marginTop: -2 },
});
