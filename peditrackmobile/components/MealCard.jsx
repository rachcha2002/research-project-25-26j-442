import { router } from 'expo-router';
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

const MealCard = ({ meal }) => {
    const navigateMealDetails = () => {
        router.push(`/feeding/${meal.id}`);
    }


  return (
    <View style={{
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 3,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#E2E8F0',
        borderWidth: 1
      }}
    >
      {/* Display meal image */}
      <Image
        source={{ uri: meal.imageUrl }}  // Use meal's image URL
        style={{ width: 80, height: 80, borderRadius: 10 }}  // Slightly larger and more rounded image
      />
      <View style={{ marginLeft: 16, flex: 1 }}>
        {/* Display meal title */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#2D3748' }}>{meal.title}</Text>
            
        {/* Display nutritional info */}
        <Text style={{ fontSize: 14, color: '#4A5568', marginTop: 6, lineHeight: 20 }}>
          Calories: {meal.nutrition?.calories || 'N/A'},{"\n"}
          Proteins: {meal.nutrition?.proteins || 'N/A'},{"\n"}
          Carbohydrates: {meal.nutrition?.carbohydrates || 'N/A'}
        </Text>

        {/* View Button */}
        <TouchableOpacity 
          style={{
            marginTop: 10,
            paddingVertical: 8,
            paddingHorizontal: 16,
            backgroundColor: '#6B46C1',
            borderRadius: 8,
            alignSelf: 'flex-start',
            shadowColor: '#6B46C1',
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
          }}
          onPress={navigateMealDetails}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MealCard;
