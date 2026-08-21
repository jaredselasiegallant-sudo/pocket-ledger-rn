import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, shadows, radii } from '../theme';
import { formatGhs, formatCompact } from '../utils/currency';

interface HeaderCardProps {
  title?: string;
  totalBalance: number;
  income: number;
  expenses: number;
}

export default function HeaderCard({
  title = 'Total Balance',
  totalBalance,
  income,
  expenses,
}: HeaderCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Subtle glass accent shapes */}
      <View style={styles.glassCircleTop} />
      <View style={styles.glassCircleBottom} />

      <View style={styles.headerRow}>
        <Text style={styles.balanceLabel}>{title}</Text>
        <View style={styles.badgeGhana}>
          <Icon name="shield-check" size={14} color={colors.accent} />
          <Text style={styles.badgeText}>GH₵ Ledger</Text>
        </View>
      </View>

      <Text style={styles.balanceAmount}>{formatGhs(totalBalance)}</Text>

      <View style={styles.chipRow}>
        {/* Income Chip */}
        <View style={styles.chip}>
          <View style={[styles.chipIconWrap, { backgroundColor: 'rgba(164, 245, 186, 0.25)' }]}>
            <Icon name="arrow-down-left" size={18} color={colors.accent} />
          </View>
          <View style={styles.chipContent}>
            <Text style={styles.chipLabel}>Income</Text>
            <Text style={styles.chipValue}>{formatCompact(income)}</Text>
          </View>
        </View>

        {/* Expense Chip */}
        <View style={styles.chip}>
          <View style={[styles.chipIconWrap, { backgroundColor: 'rgba(255, 180, 160, 0.25)' }]}>
            <Icon name="arrow-up-right" size={18} color="#FFB4A0" />
          </View>
          <View style={styles.chipContent}>
            <Text style={styles.chipLabel}>Expenses</Text>
            <Text style={styles.chipValue}>{formatCompact(expenses)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    padding: 22,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.lg,
  },
  glassCircleTop: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.glassHighlight,
  },
  glassCircleBottom: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: colors.textOnPrimaryMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeGhana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  balanceAmount: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.display,
    fontWeight: typography.fontWeight.heavy,
    marginTop: 8,
    letterSpacing: -1,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 22,
    gap: 12,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContent: {
    flex: 1,
  },
  chipLabel: {
    color: colors.textOnPrimaryMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  chipValue: {
    color: colors.textOnPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 1,
  },
});
