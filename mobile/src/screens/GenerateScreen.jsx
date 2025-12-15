import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function GenerateScreen() {
  const [budget, setBudget] = useState('');
  const [servings, setServings] = useState('2');
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedMeal, setGeneratedMeal] = useState(null);

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'glutenfree', label: 'Gluten-Free' },
    { id: 'dairyfree', label: 'Dairy-Free' },
    { id: 'lowcarb', label: 'Low-Carb' },
    { id: 'keto', label: 'Keto' },
  ];

  const toggleDietaryRestriction = (optionId) => {
    setDietaryRestrictions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleGenerate = async () => {
    if (!budget || isNaN(budget) || parseFloat(budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setGeneratedMeal({
        title: 'Spaghetti Carbonara',
        description: 'A classic Italian pasta dish with eggs, cheese, and pancetta',
        totalCost: `$${(Math.random() * parseFloat(budget)).toFixed(2)}`,
        cookingTime: '25 minutes',
        calories: '520 kcal',
        ingredients: [
          { name: 'Spaghetti', amount: '400g', cost: '$1.20' },
          { name: 'Eggs', amount: '3 large', cost: '$0.75' },
          { name: 'Parmesan cheese', amount: '100g', cost: '$2.50' },
          { name: 'Pancetta', amount: '150g', cost: '$3.20' },
          { name: 'Black pepper', amount: '1 tsp', cost: '$0.05' },
        ],
        instructions: [
          'Cook spaghetti according to package directions',
          'Beat eggs with grated Parmesan cheese',
          'Cook pancetta until crispy',
          'Combine hot pasta with egg mixture',
          'Toss with pancetta and serve immediately',
        ],
      });
      setGenerating(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Generate Meal Plan</Text>
          <Text style={styles.subtitle}>Create a meal based on your budget and preferences</Text>
        </View>

        {/* Budget Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="15.00"
              placeholderTextColor="#71717a"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Servings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Servings</Text>
          <View style={styles.servingsContainer}>
            {['1', '2', '3', '4', '5', '6+'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.servingOption,
                  servings === option && styles.servingOptionActive,
                ]}
                onPress={() => setServings(option)}
              >
                <Text
                  style={[
                    styles.servingOptionText,
                    servings === option && styles.servingOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dietary Restrictions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.dietaryContainer}>
            {dietaryOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dietaryOption,
                  dietaryRestrictions.includes(option.id) && styles.dietaryOptionActive,
                ]}
                onPress={() => toggleDietaryRestriction(option.id)}
              >
                <Text
                  style={[
                    styles.dietaryOptionText,
                    dietaryRestrictions.includes(option.id) && styles.dietaryOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={generating}
        >
          <Ionicons 
            name={generating ? "hourglass-outline" : "restaurant"} 
            size={20} 
            color="#ffffff" 
          />
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : 'Generate Meal Plan'}
          </Text>
        </TouchableOpacity>

        {/* Generated Meal */}
        {generatedMeal && (
          <View style={styles.generatedMeal}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{generatedMeal.title}</Text>
              <Text style={styles.mealDescription}>{generatedMeal.description}</Text>
            </View>

            <View style={styles.mealStats}>
              <View style={styles.statItem}>
                <Ionicons name="cash-outline" size={16} color="#10b981" />
                <Text style={styles.statText}>{generatedMeal.totalCost}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#10b981" />
                <Text style={styles.statText}>{generatedMeal.cookingTime}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame-outline" size={16} color="#10b981" />
                <Text style={styles.statText}>{generatedMeal.calories}</Text>
              </View>
            </View>

            <View style={styles.ingredientsSection}>
              <Text style={styles.subsectionTitle}>Ingredients</Text>
              {generatedMeal.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>
                    {ingredient.name} - {ingredient.amount}
                  </Text>
                  <Text style={styles.ingredientCost}>{ingredient.cost}</Text>
                </View>
              ))}
            </View>

            <View style={styles.instructionsSection}>
              <Text style={styles.subsectionTitle}>Instructions</Text>
              {generatedMeal.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>{index + 1}.</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#ffffff',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#ffffff',
  },
  servingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  servingOption: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  servingOptionActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  servingOptionText: {
    fontSize: 16,
    color: '#71717a',
  },
  servingOptionTextActive: {
    color: '#ffffff',
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dietaryOption: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dietaryOptionActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  dietaryOptionText: {
    fontSize: 14,
    color: '#71717a',
  },
  dietaryOptionTextActive: {
    color: '#ffffff',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 32,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  generatedMeal: {
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  mealHeader: {
    marginBottom: 20,
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  mealDescription: {
    fontSize: 16,
    color: '#71717a',
  },
  mealStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  ingredientCost: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  instructionsSection: {},
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginRight: 12,
    minWidth: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
});