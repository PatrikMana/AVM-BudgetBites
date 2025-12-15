import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Budget Bites</Text>
          <Text style={styles.heroSubtitle}>Jídlo podle rozpočtu</Text>
          <Text style={styles.heroDescription}>
            Spravuj ingredience, generuj recepty a spor na nákupech
          </Text>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Funkce</Text>

        <Link href="/(tabs)/dashboard" asChild>
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons name="clipboard-list" size={28} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Můj Inventář</Text>
              <Text style={styles.featureDescription}>
                Spravuj ingredience v ledničce
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/generate" asChild>
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons name="sparkles" size={28} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Generuj Jídlo</Text>
              <Text style={styles.featureDescription}>
                Vytvoř recept podle rozpočtu
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/account" asChild>
          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <MaterialCommunityIcons name="account-circle" size={28} color="#10b981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Můj Účet</Text>
              <Text style={styles.featureDescription}>
                Nastavení profilu a preferencí
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7280" />
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  heroSection: {
    backgroundColor: '#18181b',
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#10b981',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#065f46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#a1a1aa',
  },
});
