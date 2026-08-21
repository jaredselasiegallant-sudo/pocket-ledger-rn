import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addTransactionAsync } from './transactionsSlice';
import { formatGhs } from '../../utils/currency';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { TransactionType } from '../../models/types';

const TYPES: { label: string; value: TransactionType; color: string }[] = [
  { label: 'Expense', value: 'debit', color: '#DE350B' },
  { label: 'Income', value: 'credit', color: '#00875A' },
  { label: 'Transfer', value: 'transfer', color: '#0065FF' },
];

export default function AddTransactionScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector((s) => s.accounts.items);

  const [typeIndex, setTypeIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [account, setAccount] = useState('MTN MoMo');
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
          account,
          transactionDate: new Date().toISOString(),
        })
      ).unwrap();

      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Close + Title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Transaction</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtn}>{isSaving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={styles.amountBox}>
        <Text style={styles.currency}>GH₵</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor="rgba(26,28,25,0.3)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
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
            <Text style={[styles.typeTabText, typeIndex === i && { color: '#fff' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="What was this for?"
        placeholderTextColor="#717971"
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

      {/* Account */}
      <Text style={styles.label}>Account</Text>
      <View style={styles.accountRow}>
        {accountNames.map((name) => (
          <TouchableOpacity
            key={name}
            style={[styles.accountChip, account === name && styles.accountChipActive]}
            onPress={() => setAccount(name)}
          >
            <Text
              style={[styles.accountChipText, account === name && styles.accountChipTextActive]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Add notes..."
        placeholderTextColor="#717971"
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
  container: { flex: 1, backgroundColor: '#F8FAF5' },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 16,
  },
  closeBtn: { fontSize: 24, color: '#717971', padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1A1C19' },
  saveBtn: { fontSize: 15, fontWeight: '600', color: '#006B3F', padding: 8 },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#E2E6DE',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  currency: { fontSize: 28, fontWeight: '800', color: '#006B3F', marginRight: 8 },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1C19',
    padding: 0,
  },
  typeTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E6DE',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeTabText: { fontSize: 14, fontWeight: '600', color: '#717971' },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#717971',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#E2E6DE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1C19',
    marginBottom: 16,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ECF0E8',
    borderWidth: 1,
    borderColor: 'rgba(193,201,191,0.3)',
  },
  categoryChipActive: { backgroundColor: '#A4F5BA', borderColor: '#006B3F', borderWidth: 2 },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: '#717971' },
  categoryChipTextActive: { color: '#006B3F', fontWeight: '700' },
  accountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  accountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ECF0E8',
    borderWidth: 1,
    borderColor: 'rgba(193,201,191,0.3)',
  },
  accountChipActive: { backgroundColor: '#A4F5BA', borderColor: '#006B3F', borderWidth: 2 },
  accountChipText: { fontSize: 13, fontWeight: '500', color: '#717971' },
  accountChipTextActive: { color: '#006B3F', fontWeight: '700' },
  saveButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
