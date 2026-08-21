import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Transaction } from '../models/types';
import { colors, typography, radii } from '../theme';
import { formatGhs } from '../utils/currency';
import { getDateLabel, getCategoryColor } from '../utils/helpers';

interface TransactionTileProps {
  transaction: Transaction;
  onPress?: () => void;
}

export default function TransactionTile({ transaction, onPress }: TransactionTileProps) {
  const isCredit = transaction.type === 'credit';
  const categoryColor = getCategoryColor(transaction.category);
  const color = isCredit ? colors.income : colors.expense;
  const iconName = isCredit ? 'arrow-bottom-left' : 'arrow-top-right';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${categoryColor}15` }]}>
        <Icon name={iconName} size={20} color={color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.title}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.category}>{transaction.category || 'Other'}</Text>
          {transaction.account && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.account}>{transaction.account}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.amountCol}>
        <Text style={[styles.amount, { color }]}>
          {isCredit ? '+' : '-'}{formatGhs(transaction.amount)}
        </Text>
        <Text style={styles.date}>{getDateLabel(transaction.transactionDate)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: 8,
    marginHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  category: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  dot: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  account: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
