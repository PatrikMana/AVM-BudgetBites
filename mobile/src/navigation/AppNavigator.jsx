import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GenerateScreen from '../screens/GenerateScreen';
import AccountScreen from '../screens/AccountScreen';

// Import context/hooks
import { useAuth } from '../hooks/useAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Generate') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: {
          backgroundColor: '#18181b',
          borderTopColor: '#27272a',
          paddingTop: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Generate" 
        component={GenerateScreen}
        options={{
          tabBarLabel: 'Generate',
        }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // You can show a loading screen here
  }

  return (
    <NavigationContainer>
      {session ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}