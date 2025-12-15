import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export default function AccountScreen() {
  const { signOut, session } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Profile Settings',
      description: 'Edit your personal information',
      onPress: () => Alert.alert('Coming Soon', 'Profile settings will be available soon'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      icon: 'card-outline',
      title: 'Subscription',
      description: 'Manage your subscription plan',
      onPress: () => Alert.alert('Coming Soon', 'Subscription management will be available soon'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      description: 'Get help and contact support',
      onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      description: 'App version and information',
      onPress: () => Alert.alert('About BudgetBites', 'Version 1.0.0\n\nBudgetBites helps you create delicious meals on a budget.'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="#10b981" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Welcome!</Text>
            <Text style={styles.userEmail}>{session?.user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon} size={20} color="#10b981" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#71717a" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for budget-conscious foodies</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#71717a',
  },
  menuContainer: {
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#71717a',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#52525b',
    textAlign: 'center',
  },
});