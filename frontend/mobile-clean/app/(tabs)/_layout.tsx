import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domů',
          headerTitle: 'Budget Bites',
          tabBarLabel: 'Domů',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inventář',
          headerTitle: 'Můj Inventář',
          tabBarLabel: 'Inventář',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clipboard-list" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generuj',
          headerTitle: 'Generuj Jídlo',
          tabBarLabel: 'Generuj',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chef-hat" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Účet',
          headerTitle: 'Můj Účet',
          tabBarLabel: 'Účet',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
