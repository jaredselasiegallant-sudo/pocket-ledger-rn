import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTransactionAsync } from './transactionsSlice';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { TransactionType } from '../../models/types';
import { colors, typography, shadows, radii } from '../../theme';

const TYPES: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'debit', color: colors.expense },
  { label: 'Income', value: 'credit', color: colors.income },
  { label: 'Transfer', value: 'transfer', color: colors.info },
];

export default function AddTransactionScreen({ navigation, route }: any) {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector((s) => s.accounts.items);

  const initialType = route?.params?.initialType;
  const initialIdx = TYPES.findIndex((t) => t.value === initialType);

  const [typeIndex, setTypeIndex] = useState(initialIdx !== -1 ? initialIdx : 0);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(route?.params?.initialCategory || 'Food & Dining');
  const [account, setAccount] = useState('MTN MoMo');
  const [fromAccount, setFromAccount] = useState('MTN MoMo');
  const [toAccount, setToAccount] = useState('Cash Wallet');
  const [isSaving, setIsSaving] = useState(false);

  const accountNames = accounts.filter((a) => a.isActive).map((a) => a.name);

  useEffect(() => {
    if (accountNames.length > 0 && !accountNames.includes(account)) {
      setAccount(accountNames[0]);
    }
  }, [accountNames]);

  const selectedType = TYPES[typeIndex];

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(
        addTransactionAsync({
          title: title.trim() || category,
          description: notes.trim() || undefined,
          amount: parsedAmount,
          type: selectedType.value,
          category,
          account: selectedType.value === 'transfer' ? undefined : account,
          fromAccount: selectedType.value === 'transfer' ? fromAccount : undefined,
          toAccount: selectedType.value === 'transfer' ? toAccount : undefined,
          transactionDate: new Date().toISOString(),
        })
      ).unwrap();

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Close Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Transaction</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtn}>{isSaving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Amount Display Input Box */}
      <View style={styles.amountBox}>
        <Text style={styles.currency}>GH₵</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          autoFocus
        />
      </View>

      {/* Type Tabs */}
      <View style={styles.typeTabs}>
        {TYPES.map((t, i) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.typeTab, typeIndex === i && { backgroundColor: t.color }]}
            onPress={() => setTypeIndex(i)}
          >
            <Text style={[styles.typeTabText, typeIndex === i && { color: colors.textOnPrimary }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Title / Description</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Lunch at Chop Bar, Uber ride..."
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {DEFAULT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedType.value === 'transfer' ? (
        <>
          <Text style={styles.label}>From account</Text>
          <View style={styles.accountRow}>{accountNames.map((name) => <TouchableOpacity key={`from-${name}`} style={[styles.accountChip, fromAccount === name && styles.accountChipActive]} onPress={() => setFromAccount(name)}><Text style={[styles.accountChipText, fromAccount === name && styles.accountChipTextActive]}>{name}</Text></TouchableOpacity>)}</View>
          <Text style={styles.label}>To account</Text>
          <View style={styles.accountRow}>{accountNames.map((name) => <TouchableOpacity key={`to-${name}`} style={[styles.accountChip, toAccount === name && styles.accountChipActive]} onPress={() => setToAccount(name)}><Text style={[styles.accountChipText, toAccount === name && styles.accountChipTextActive]}>{name}</Text></TouchableOpacity>)}</View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Payment Account</Text>
          <View style={styles.accountRow}>{accountNames.map((name) => <TouchableOpacity key={name} style={[styles.accountChip, account === name && styles.accountChipActive]} onPress={() => setAccount(name)}><Text style={[styles.accountChipText, account === name && styles.accountChipTextActive]}>{name}</Text></TouchableOpacity>)}</View>
        </>
      )}

      {/* Notes */}
      <Text style={styles.label}>Additional Notes (Optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Reference code or details..."
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: selectedType.color }]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {selectedType.value === 'debit'
            ? 'Record Expense'
            : selectedType.value === 'credit'
            ? 'Record Income'
            : 'Record Transfer'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 16,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  saveBtn: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    padding: 6,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.sm,
  },
  currency: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.heavy,
    color: colors.primary,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    color: colors.textPrimary,
    padding: 0,
  },
  typeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.lg,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  accountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  accountChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  accountChipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  accountChipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  saveButton: {
    height: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...shadows.md,
  },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
