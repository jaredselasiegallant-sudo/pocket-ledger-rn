import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import TransactionListScreen from '../features/transactions/TransactionListScreen';
import BudgetScreen from '../features/budget/BudgetScreen';
import ReportsScreen from '../features/reports/ReportsScreen';
import SettingsScreen from '../features/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Home: 'home',
  'Home-active': 'home',
  Transactions: 'receipt-long',
  'Transactions-active': 'receipt-long',
  Budget: 'wallet',
  'Budget-active': 'wallet',
  Reports: 'chart-bar',
  'Reports-active': 'chart-bar',
  Settings: 'cog',
  'Settings-active': 'cog',
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused ? `${route.name}-active` : route.name;
          return <Icon name={ICONS[iconName] || 'circle'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#006B3F',
        tabBarInactiveTintColor: '#717971',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'PlusJakartaSans-SemiBold',
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
