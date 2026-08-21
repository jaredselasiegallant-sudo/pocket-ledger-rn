import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/app/store';
import { useAppDispatch } from './src/app/hooks';
import { loadTransactionsAsync } from './src/features/transactions/transactionsSlice';
import { loadAccountsAsync } from './src/features/dashboard/accountsSlice';
import { loadBudgetsAsync } from './src/features/budget/budgetSlice';
import AppNavigator from './src/navigation/AppNavigator';
import AddTransactionScreen from './src/features/transactions/AddTransactionScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadTransactionsAsync());
    dispatch(loadAccountsAsync());
    dispatch(loadBudgetsAsync());
  }, [dispatch]);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAF5" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={AppNavigator} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
