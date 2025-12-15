import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function DashboardScreen() {
  const [inventory, setInventory] = useState([
    { id: '1', name: 'Kuřecí prsa', quantity: '500g', date: '2025-12-08' },
    { id: '2', name: 'Rajčata', quantity: '6 ks', date: '2025-12-09' },
    { id: '3', name: 'Těstoviny', quantity: '250g', date: '2025-12-07' },
    { id: '4', name: 'Cibule', quantity: '3 ks', date: '2025-12-08' },
  ]);

  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const previousGenerations = [
    {
      id: '1',
      date: '2025-12-09',
      title: 'Středomořská večeře',
      budget: '250 Kč',
      calories: '450 kcal',
    },
    {
      id: '2',
      date: '2025-12-08',
      title: 'Rychlý oběd',
      budget: '200 Kč',
      calories: '380 kcal',
    },
    {
      id: '3',
      date: '2025-12-07',
      title: 'Rodinná večeře',
      budget: '500 Kč',
      calories: '520 kcal',
    },
  ];

  const handleAddItem = () => {
    if (newName.trim() && newQuantity.trim()) {
      setInventory([...inventory, {
        id: Date.now().toString(),
        name: newName,
        quantity: newQuantity,
        date: new Date().toISOString().split('T')[0],
      }]);
      setNewName('');
      setNewQuantity('');
    }
  };

  const handleRemoveItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Generate New Meal Plan Card */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="chef-hat" size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>Vygeneruj nový plán jídel</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Vytvoř plán jídel na základě tvého rozpočtu a dostupných ingrediencí
        </Text>
        <TouchableOpacity style={styles.generateButton}>
          <MaterialCommunityIcons name="chef-hat" size={20} color="white" />
          <Text style={styles.generateButtonText}>Začít generovat</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Section */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>Přidej ingredienci</Text>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Název ingredience"
          placeholderTextColor="#6b7280"
          value={newName}
          onChangeText={setNewName}
        />
        <TextInput
          style={styles.input}
          placeholder="Množství (např. 500g, 5ks)"
          placeholderTextColor="#6b7280"
          value={newQuantity}
          onChangeText={setNewQuantity}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Přidat</Text>
        </TouchableOpacity>
      </View>

      {/* Inventory Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Můj inventář ({inventory.length})</Text>
        <FlatList
          scrollEnabled={false}
          data={inventory}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.inventoryItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>{item.quantity}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                <MaterialCommunityIcons name="trash-can" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* History Section */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="history" size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>Historie generování</Text>
        </View>
        {previousGenerations.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <View style={styles.historyMeta}>
                <Text style={styles.historyDetails}>{item.date}</Text>
                <Text style={styles.historyDot}>•</Text>
                <Text style={styles.historyDetails}>{item.budget}</Text>
                <Text style={styles.historyDot}>•</Text>
                <Text style={styles.historyDetails}>{item.calories}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  section: {
    backgroundColor: '#27272a',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 12,
    lineHeight: 20,
  },
  generateButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#18181b',
  },
  addButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  historyItem: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  historyContent: {
    gap: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDetails: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  historyDot: {
    color: '#6b7280',
    fontSize: 12,
  },
});
