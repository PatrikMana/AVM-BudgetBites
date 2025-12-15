import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function GenerateScreen() {
  const [budget, setBudget] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  const handleGenerate = () => {
    setGeneratedRecipe({
      title: 'Kuřecí steak s rajčatovým salátem',
      budget: budget || '200 Kč',
      servings: 2,
      prepTime: '20 minut',
      calories: '450 kcal',
      ingredients: [
        { item: 'Kuřecí prsa', amount: '400g' },
        { item: 'Rajčata', amount: '3 ks' },
        { item: 'Cibule', amount: '1 ks' },
        { item: 'Olej', amount: '2 lžíce' },
      ],
      instructions: [
        'Kuřecí maso nakrájej na steaky',
        'Osoluj, pepři a zavař na pánvi',
        'Servíruj s čerstvým rajčatovým salátem',
      ],
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="chef-hat" size={24} color="#10b981" />
          <Text style={styles.sectionTitle}>Generátor receptů</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Řekni nám, co chceš vařit a my ti vytvoříme recept
        </Text>
        
        <Text style={styles.label}>Tvůj rozpočet (Kč)</Text>
        <TextInput
          style={styles.input}
          placeholder="Např. 200"
          placeholderTextColor="#6b7280"
          value={budget}
          onChangeText={setBudget}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Typ kuchyně</Text>
        <TextInput
          style={styles.input}
          placeholder="Např. česká, středomořská"
          placeholderTextColor="#6b7280"
          value={cuisineType}
          onChangeText={setCuisineType}
        />

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <MaterialCommunityIcons name="chef-hat" size={20} color="white" />
          <Text style={styles.generateButtonText}>Generuj recept</Text>
        </TouchableOpacity>
      </View>

      {generatedRecipe && (
        <View style={styles.recipeSection}>
          <View style={styles.recipeHeader}>
            <MaterialCommunityIcons name="book-open" size={24} color="#10b981" />
            <Text style={styles.recipeTitleMain}>{generatedRecipe.title}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock" size={16} color="#10b981" />
            <Text style={styles.infoText}>{generatedRecipe.prepTime}</Text>
            <Text style={styles.infoDot}>•</Text>
            <Text style={styles.infoText}>{generatedRecipe.servings} porce</Text>
            <Text style={styles.infoDot}>•</Text>
            <Text style={styles.infoText}>{generatedRecipe.calories}</Text>
          </View>

          <Text style={styles.subTitle}>Ingredience</Text>
          {generatedRecipe.ingredients.map((ing, idx) => (
            <View key={idx} style={styles.ingredient}>
              <Text style={styles.ingredientText}>{ing.item}</Text>
              <Text style={styles.ingredientAmount}>{ing.amount}</Text>
            </View>
          ))}

          <Text style={styles.subTitle}>Postup</Text>
          {generatedRecipe.instructions.map((step, idx) => (
            <Text key={idx} style={styles.instruction}>
              {idx + 1}. {step}
            </Text>
          ))}
        </View>
      )}
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
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#18181b',
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
  recipeSection: {
    backgroundColor: '#27272a',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recipeTitleMain: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#a1a1aa',
  },
  infoDot: {
    color: '#6b7280',
    fontSize: 13,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 12,
  },
  ingredient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3f3f46',
  },
  ingredientText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  instruction: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 12,
    lineHeight: 20,
  },
});
