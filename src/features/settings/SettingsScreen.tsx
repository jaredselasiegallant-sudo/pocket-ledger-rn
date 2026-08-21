import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTransactionAsync } from '../transactions/transactionsSlice';
import { setThemeMode } from '../../app/appSlice';
import { ThemeMode } from '../../models/types';
import { formatGhs } from '../../utils/currency';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.app.themeMode);
  const transactions = useAppSelector((s) => s.transactions.items);

  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('Food & Dining');

  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  const handleQuickExpense = async () => {
    const parsed = parseFloat(quickAmount);
    if (!parsed || parsed <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    try {
      await dispatch(
        addTransactionAsync({
          title: `Quick: ${quickCategory}`,
          amount: parsed,
          type: 'debit',
          category: quickCategory,
        })
      ).unwrap();

      setShowQuickExpense(false);
      setQuickAmount('');
      Alert.alert('Done', `Quick expense of ${formatGhs(parsed)} recorded`);
    } catch {
      Alert.alert('Error', 'Failed to record expense');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Quick Expense */}
      <TouchableOpacity style={styles.menuCard} onPress={() => setShowQuickExpense(!showQuickExpense)}>
        <View style={styles.menuIcon}>
          <Icon name="flash" size={22} color="#FF991F" />
        </View>
        <View style={styles.menuInfo}>
          <Text style={styles.menuTitle}>Quick Expense</Text>
          <Text style={styles.menuSubtitle}>Log an expense in seconds</Text>
        </View>
        <Icon name="chevron-right" size={20} color="#717971" />
      </TouchableOpacity>

      {showQuickExpense && (
        <View style={styles.quickExpenseForm}>
          <TextInput
            style={styles.input}
            placeholder="Amount (GH₵)"
            placeholderTextColor="#717971"
            value={quickAmount}
            onChangeText={setQuickAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
          <View style={styles.categoryRow}>
            {DEFAULT_CATEGORIES.slice(0, 6).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, quickCategory === cat && styles.catChipActive]}
                onPress={() => setQuickCategory(cat)}
              >
                <Text style={[styles.catChipText, quickCategory === cat && styles.catChipTextActive]}>
                  {cat.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.quickSaveBtn} onPress={handleQuickExpense}>
            <Text style={styles.quickSaveBtnText}>Record Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.themeRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.themeBtn, themeMode === mode && styles.themeBtnActive]}
              onPress={() => dispatch(setThemeMode(mode))}
            >
              <Icon
                name={mode === 'light' ? 'weather-sunny' : mode === 'dark' ? 'weather-night' : 'cellphone'}
                size={18}
                color={themeMode === mode ? '#fff' : '#717971'}
              />
              <Text style={[styles.themeBtnText, themeMode === mode && styles.themeBtnTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTransactions}</Text>
            <Text style={styles.statLabel}>Total Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00875A' }]}>{formatGhs(totalIncome)}</Text>
            <Text style={styles.statLabel}>Total Income</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#DE350B' }]}>{formatGhs(totalExpenses)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#006B3F' }]}>
              {formatGhs(totalIncome - totalExpenses)}
            </Text>
            <Text style={styles.statLabel}>Net Savings</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutApp}>PocketLedger</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Offline-first personal finance tracker with Ghana Cedi (GHS) as default currency.
          </Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF5' },
  content: { padding: 16 },
  header: { paddingHorizontal: 4, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#1A1C19' },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF991F12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1A1C19' },
  menuSubtitle: { fontSize: 13, color: '#717971', marginTop: 2 },
  quickExpenseForm: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#E2E6DE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1C19',
    marginBottom: 12,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ECF0E8',
  },
  catChipActive: { backgroundColor: '#A4F5BA' },
  catChipText: { fontSize: 12, fontWeight: '500', color: '#717971' },
  catChipTextActive: { color: '#006B3F', fontWeight: '700' },
  quickSaveBtn: {
    backgroundColor: '#DE350B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#717971', marginBottom: 12 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ECF0E8',
    gap: 6,
  },
  themeBtnActive: { backgroundColor: '#006B3F' },
  themeBtnText: { fontSize: 13, fontWeight: '600', color: '#717971' },
  themeBtnTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1C19' },
  statLabel: { fontSize: 12, color: '#717971', marginTop: 4 },
  aboutCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  aboutApp: { fontSize: 18, fontWeight: '700', color: '#006B3F' },
  aboutVersion: { fontSize: 13, color: '#717971', marginTop: 2 },
  aboutDesc: { fontSize: 14, color: '#717971', marginTop: 8, lineHeight: 20 },
});
