import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const [inventory, setInventory] = useState([
    { id: 1, name: "Chicken Breast", quantity: "500g", addedDate: "2025-11-08" },
    { id: 2, name: "Tomatoes", quantity: "6pcs", addedDate: "2025-11-09" },
    { id: 3, name: "Pasta", quantity: "250g", addedDate: "2025-11-07" },
    { id: 4, name: "Onions", quantity: "3pcs", addedDate: "2025-11-08" },
    { id: 5, name: "Cheese", quantity: "200g", addedDate: "2025-11-10" },
  ]);

  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const previousGenerations = [
    {
      id: 1,
      date: "2025-11-09",
      title: "Mediterranean Dinner",
      budget: "$5",
      calories: "450 kcal",
    },
    {
      id: 2,
      date: "2025-11-08",
      title: "Quick Weekend Lunch",
      budget: "$4",
      calories: "380 kcal",
    },
    {
      id: 3,
      date: "2025-11-07",
      title: "Family Dinner for 4",
      budget: "$10",
      calories: "520 kcal",
    },
  ];

  const handleAddItem = () => {
    if (newItem.trim() && newQuantity.trim()) {
      setInventory([
        ...inventory,
        {
          id: Date.now(),
          name: newItem,
          quantity: newQuantity,
          addedDate: new Date().toISOString().split('T')[0],
        },
      ]);
      setNewItem('');
      setNewQuantity('');
    }
  };

  const handleRemoveItem = (id) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setInventory(inventory.filter((item) => item.id !== id)),
        },
      ]
    );
  };

  const renderInventoryItem = ({ item }) => (
    <View style={styles.inventoryItem}>
      <View style={styles.inventoryItemContent}>
        <Text style={styles.inventoryItemName}>{item.name}</Text>
        <Text style={styles.inventoryItemQuantity}>{item.quantity}</Text>
        <Text style={styles.inventoryItemDate}>Added: {item.addedDate}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveItem(item.id)}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={16} color="#71717a" />
      </TouchableOpacity>
    </View>
  );

  const renderGenerationItem = ({ item }) => (
    <TouchableOpacity style={styles.generationItem}>
      <View style={styles.generationContent}>
        <Text style={styles.generationTitle}>{item.title}</Text>
        <View style={styles.generationMeta}>
          <Ionicons name="calendar-outline" size={12} color="#71717a" />
          <Text style={styles.generationDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.generationStats}>
        <Text style={styles.generationStat}>Budget: {item.budget}</Text>
        <Text style={styles.generationStat}>Calories: {item.calories}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back! Create your next delicious meal plan.</Text>
        </View>

        {/* Generate New Meal Plan Card */}
        <TouchableOpacity
          style={styles.generateCard}
          onPress={() => navigation.navigate('Generate')}
        >
          <View style={styles.generateHeader}>
            <Ionicons name="restaurant" size={20} color="#34d399" />
            <Text style={styles.generateTitle}>Generate New Meal Plan</Text>
          </View>
          <Text style={styles.generateSubtitle}>
            Create a meal plan based on current deals and your budget
          </Text>
          <View style={styles.generateButton}>
            <Ionicons name="sparkles" size={16} color="#ffffff" />
            <Text style={styles.generateButtonText}>Start Generating</Text>
          </View>
        </TouchableOpacity>

        {/* Add Item Section */}
        <View style={styles.addItemSection}>
          <Text style={styles.sectionTitle}>Add to Inventory</Text>
          <View style={styles.addItemForm}>
            <TextInput
              style={styles.input}
              placeholder="Food name"
              placeholderTextColor="#71717a"
              value={newItem}
              onChangeText={setNewItem}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity (e.g. 500g, 3pcs)"
              placeholderTextColor="#71717a"
              value={newQuantity}
              onChangeText={setNewQuantity}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Inventory</Text>
          <FlatList
            data={inventory}
            renderItem={renderInventoryItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            style={styles.inventoryList}
          />
        </View>

        {/* Generation History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>Generation History</Text>
          </View>
          <FlatList
            data={previousGenerations}
            renderItem={renderGenerationItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollView: {
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
  generateCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  generateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  generateSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addItemSection: {
    marginBottom: 32,
  },
  addItemForm: {
    gap: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inventoryList: {
    marginTop: -8,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  inventoryItemContent: {
    flex: 1,
  },
  inventoryItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  inventoryItemQuantity: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 4,
  },
  inventoryItemDate: {
    fontSize: 12,
    color: '#52525b',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(39, 39, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  generationContent: {
    flex: 1,
  },
  generationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  generationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generationDate: {
    fontSize: 14,
    color: '#71717a',
    marginLeft: 8,
  },
  generationStats: {
    alignItems: 'flex-end',
  },
  generationStat: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 4,
  },
});