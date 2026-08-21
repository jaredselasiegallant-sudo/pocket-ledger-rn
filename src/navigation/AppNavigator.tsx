import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import TransactionListScreen from '../features/transactions/TransactionListScreen';
import BudgetScreen from '../features/budget/BudgetScreen';
import ReportsScreen from '../features/reports/ReportsScreen';
import SettingsScreen from '../features/settings/SettingsScreen';
import { colors, typography } from '../theme';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Transactions: { active: 'receipt', inactive: 'receipt-outline' },
  Budget: { active: 'wallet', inactive: 'wallet-outline' },
  Reports: { active: 'chart-box', inactive: 'chart-box-outline' },
  Settings: { active: 'cog', inactive: 'cog-outline' },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const config = ICONS[route.name] || { active: 'circle', inactive: 'circle-outline' };
          const iconName = focused ? config.active : config.inactive;
          return <Icon name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionListScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
