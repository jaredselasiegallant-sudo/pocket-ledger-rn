import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTransactionAsync, loadTransactionsAsync } from '../transactions/transactionsSlice';
import { loadBudgetsAsync } from '../budget/budgetSlice';
import { loadAccountsAsync, resetAccounts } from '../dashboard/accountsSlice';
import { resetPreferences } from '../../app/appSlice';
import { setThemeMode } from '../../app/appSlice';
import { ThemeMode } from '../../models/types';
import { formatGhs } from '../../utils/currency';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { colors, typography, shadows, radii } from '../../theme';
import { notificationImporter } from '../../services/notificationImporter';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((s) => s.app.themeMode);
  const transactions = useAppSelector((s) => s.transactions.items);

  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickCategory, setQuickCategory] = useState('Food & Dining');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  useEffect(() => { if (notificationImporter.isSupported) notificationImporter.isEnabled().then(setNotificationEnabled); }, []);

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
      Alert.alert('Success', `Quick expense of ${formatGhs(parsed)} recorded`);
    } catch {
      Alert.alert('Error', 'Failed to record expense');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>
      </View>

      {/* Quick Expense Shortcut */}
      <TouchableOpacity
        style={styles.menuCard}
        activeOpacity={0.8}
        onPress={() => setShowQuickExpense(!showQuickExpense)}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.warningSoft }]}>
          <Icon name="flash-outline" size={22} color={colors.warning} />
        </View>
        <View style={styles.menuInfo}>
          <Text style={styles.menuTitle}>Quick Expense Shortcut</Text>
          <Text style={styles.menuSubtitle}>Log an expense in a few taps</Text>
        </View>
        <Icon name={showQuickExpense ? 'chevron-up' : 'chevron-right'} size={22} color={colors.textMuted} />
      </TouchableOpacity>

      {showQuickExpense && (
        <View style={styles.quickExpenseForm}>
          <Text style={styles.formLabel}>Amount (GH₵)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            value={quickAmount}
            onChangeText={setQuickAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
          <Text style={styles.formLabel}>Category</Text>
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

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Appearance</Text>
        <View style={styles.themeRow}>
          {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.themeBtn, themeMode === mode && styles.themeBtnActive]}
              onPress={() => dispatch(setThemeMode(mode))}
            >
              <Icon
                name={mode === 'light' ? 'weather-sunny' : mode === 'dark' ? 'weather-night' : 'cellphone-cog'}
                size={18}
                color={themeMode === mode ? colors.textOnPrimary : colors.textMuted}
              />
              <Text style={[styles.themeBtnText, themeMode === mode && styles.themeBtnTextActive]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {notificationImporter.isSupported && <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatic detection</Text>
        <TouchableOpacity style={styles.menuCard} onPress={() => { notificationImporter.openSettings(); setTimeout(() => notificationImporter.isEnabled().then(setNotificationEnabled), 800); }}>
          <View style={[styles.menuIcon, { backgroundColor: colors.infoSoft }]}><Icon name="bell-check-outline" size={22} color={colors.info} /></View>
          <View style={styles.menuInfo}><Text style={styles.menuTitle}>Money notifications</Text><Text style={styles.menuSubtitle}>{notificationEnabled ? 'Enabled — detected alerts wait for review' : 'Tap to enable MTN MoMo and Telecel Cash alerts'}</Text></View><Icon name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>}

      {/* Financial Overview Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ledger Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalTransactions}</Text>
            <Text style={styles.statLabel}>Total Logs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.income }]}>{formatGhs(totalIncome)}</Text>
            <Text style={styles.statLabel}>Total Income</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.expense }]}>{formatGhs(totalExpenses)}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {formatGhs(totalIncome - totalExpenses)}
            </Text>
            <Text style={styles.statLabel}>Net Balance</Text>
          </View>
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity
          style={styles.clearDataCard}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Reset Ledger Storage',
              'This will erase all saved transactions and budget limits. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset Data',
                  style: 'destructive',
                  onPress: () => {
                    try {
                      const storage = new (require('react-native-mmkv').MMKV)();
                      storage.clearAll();
                      dispatch(resetAccounts());
                      dispatch(resetPreferences());
                      dispatch(loadTransactionsAsync());
                      dispatch(loadBudgetsAsync());
                      dispatch(loadAccountsAsync());
                      Alert.alert('Reset Complete', 'Local storage has been reset');
                    } catch {
                      Alert.alert('Error', 'Failed to clear storage');
                    }
                  },
                },
              ]
            );
          }}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.expenseSoft }]}>
            <Icon name="database-remove-outline" size={22} color={colors.expense} />
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuTitle, { color: colors.expense }]}>Clear Ledger Storage</Text>
            <Text style={styles.menuSubtitle}>Reset all local transactions & budgets</Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* About & System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <View style={styles.appIconBg}>
              <Icon name="wallet" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.aboutApp}>Pocket Ledger</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0 (GHS Native)</Text>
            </View>
          </View>
          <Text style={styles.aboutDesc}>
            Offline-first mobile financial manager optimized for Ghana (GH₵) with MMKV instant storage & local budgeting.
          </Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    paddingHorizontal: 4,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  clearDataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(222, 53, 11, 0.15)',
    ...shadows.sm,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  quickExpenseForm: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSubtle,
  },
  catChipActive: {
    backgroundColor: colors.primarySoft,
  },
  catChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  quickSaveBtn: {
    backgroundColor: colors.expense,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickSaveBtnText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 6,
  },
  themeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  themeBtnTextActive: {
    color: colors.textOnPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  aboutCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  appIconBg: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutApp: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  aboutVersion: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  aboutDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
