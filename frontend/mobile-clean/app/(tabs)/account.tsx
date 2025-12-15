import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function AccountScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [user] = useState({
    name: 'Jakub Pluhácek',
    email: 'jakub@example.com',
    joinDate: 'Únor 2024',
  });

  const handleLogout = () => {
    Alert.alert('Odhlášení', 'Opravdu se chceš odhlásit?', [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Odhlásit se',
        onPress: () => setIsLoggedIn(false),
        style: 'destructive',
      },
    ]);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.loginSection}>
          <MaterialCommunityIcons name="account-circle" size={80} color="#10b981" />
          <Text style={styles.loginTitle}>Nejsi přihlášený</Text>
          <Text style={styles.loginSubtitle}>
            Přihlaš se a využívej všechny funkce Budget Bites
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Přihlášení</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <MaterialCommunityIcons name="account-circle" size={64} color="#10b981" />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <Text style={styles.joinDate}>Člen od {user.joinDate}</Text>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="chef-hat" size={24} color="#10b981" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Jídel</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="calendar" size={24} color="#10b981" />
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Dní v plánu</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="cash" size={24} color="#10b981" />
          <Text style={styles.statValue}>2450</Text>
          <Text style={styles.statLabel}>Kč ušetřeno</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cog" size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>Nastavení</Text>
        </View>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="bell" size={20} color="#10b981" />
            <Text style={styles.settingText}>Notifikace</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="palette" size={20} color="#10b981" />
            <Text style={styles.settingText}>Vzhled</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="lock" size={20} color="#10b981" />
            <Text style={styles.settingText}>Bezpečnost</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <MaterialCommunityIcons name="information" size={20} color="#10b981" />
            <Text style={styles.settingText}>O aplikaci</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Odhlásit se</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  profileSection: {
    backgroundColor: '#10b981',
    padding: 24,
    alignItems: 'center',
    paddingTop: 32,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
  },
  profileEmail: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#a7f3d0',
    marginTop: 8,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#27272a',
    marginHorizontal: 12,
    marginVertical: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#27272a',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  loginSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
