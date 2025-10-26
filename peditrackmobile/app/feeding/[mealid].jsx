import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';  // Import useLocalSearchParams to get mealId
import { doc, getDoc } from 'firebase/firestore';  // Firestore imports
import { db } from '../../lib/firebase'; 
import { SafeAreaView } from 'react-native-safe-area-context'; 
import SubScreenHeader from '../../components/SubScreenHeader';  // Firestore instance

const MealDetails = () => {
  const [meal, setMeal] = useState(null);  // State to hold meal details
  const [loading, setLoading] = useState(true);  // State to manage loading
  const { mealid } = useLocalSearchParams();  // Get mealId from the route params

  useEffect(() => {
    const fetchMeal = async () => {
      try {
        // Reference the specific meal document by mealId
        const mealDocRef = doc(db, 'mealbank', mealid);
        const mealSnapshot = await getDoc(mealDocRef);

        if (mealSnapshot.exists()) {
          setMeal(mealSnapshot.data());  // Set meal data to state
        } else {
          console.error('No such meal found!');
        }
      } catch (error) {
        console.error('Error fetching meal:', error);
      }
      setLoading(false);  // Stop loading spinner
    };

    if (mealid) {
      fetchMeal();  // Fetch meal data when the mealId is available
    }
  }, [mealid]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6B46C1" />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>
          Meal not found!
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
    
      <ScrollView style={{ padding: 16 }}>
      <SubScreenHeader goBackPath="/feeding/mealbank" />
        {/* Meal Title */}
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#2D3748' }}>
          {meal.title}
        </Text>

        {/* Meal Image */}
        <Image
          source={{ uri: meal.imageUrl }}
          style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 1 }}
        />
          {/* Age Group (Category) */}
          <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6B46C1', marginBottom: 8 }}>
            Age Group
          </Text>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>
            {meal.category || 'Unknown'}
          </Text>
        </View>

        {/* Ingredients */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6B46C1', marginBottom: 8 }}>
            Ingredients
          </Text>
          {meal.ingredients?.map((ingredient, index) => (
            <Text key={index} style={{ fontSize: 16, marginTop: 4, color: '#4A5568' }}>
              {typeof ingredient === 'object' ? ingredient.name : ingredient}
            </Text>
          ))}
        </View>

      
        {/* Preparation Steps */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6B46C1', marginBottom: 8 }}>
            Preparation Steps
          </Text>
          {meal.steps?.map((step, index) => (
            <Text key={index} style={{ fontSize: 16, marginTop: 4, color: '#4A5568' }}>
              {index + 1}. {step}
            </Text>
          ))}
        </View>

        {/* Nutritional Information */}
        <View style={{ marginTop: 16,marginBottom:30}}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#6B46C1', marginBottom: 8 }}>
            Nutritional Information
          </Text>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>
            Calories: {meal.nutrition?.calories || 'N/A'}
          </Text>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>
            Proteins: {meal.nutrition?.proteins || 'N/A'}
          </Text>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>
            Carbohydrates: {meal.nutrition?.carbohydrates || 'N/A'}
          </Text>
          <Text style={{ fontSize: 16, color: '#4A5568' }}>
            Vitamins: {meal.nutrition?.vitamins?.join(', ') || 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MealDetails;
