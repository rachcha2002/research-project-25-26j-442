const mealsList = [
    // 6-12 months category
    {
      title: "Mashed Rice with Dhal",
      category: "6-12 months",
      imageUrl: "https://example.com/mashed-rice-dhal.jpg",
      ingredients: [
        { name: "Rice", quantity: "1/4 cup" },
        { name: "Dhal", quantity: "2 tbsp" },
        { name: "Coconut milk", quantity: "2 tbsp" }
      ],
      steps: [
        "Cook rice and dhal until soft.",
        "Mix with coconut milk to make it creamy.",
        "Mash well before serving."
      ],
      nutrition: {
        calories: "120 kcal",
        proteins: "4g",
        carbohydrates: "20g",
        vitamins: ["B1", "C"]
      }
    },
    {
      title: "Mashed Banana and Avocado",
      category: "6-12 months",
      imageUrl: "https://example.com/banana-avocado.jpg",
      ingredients: [
        { name: "Banana", quantity: "1 medium" },
        { name: "Avocado", quantity: "1/2" }
      ],
      steps: [
        "Peel and mash the banana.",
        "Scoop out the avocado and mash it.",
        "Mix together and serve."
      ],
      nutrition: {
        calories: "180 kcal",
        proteins: "2g",
        carbohydrates: "24g",
        vitamins: ["A", "C", "E"]
      }
    },
    {
      title: "Vegetable Puree",
      category: "6-12 months",
      imageUrl: "https://example.com/veg-puree.jpg",
      ingredients: [
        { name: "Carrot", quantity: "1 small" },
        { name: "Pumpkin", quantity: "1/4 cup" },
        { name: "Potato", quantity: "1/4 cup" }
      ],
      steps: [
        "Peel and steam the vegetables until soft.",
        "Mash or blend to make a smooth puree.",
        "Add water or breast milk if needed."
      ],
      nutrition: {
        calories: "70 kcal",
        proteins: "2g",
        carbohydrates: "15g",
        vitamins: ["A", "C"]
      }
    },
    {
      title: "Egg Yolk and Potato Mash",
      category: "7-12 months",
      imageUrl: "https://example.com/egg-potato.jpg",
      ingredients: [
        { name: "Egg yolk", quantity: "1" },
        { name: "Potato", quantity: "1 small" },
        { name: "Butter", quantity: "1 tsp" }
      ],
      steps: [
        "Boil the egg and separate the yolk.",
        "Mash the potato with butter.",
        "Mix in the egg yolk and serve."
      ],
      nutrition: {
        calories: "150 kcal",
        proteins: "6g",
        carbohydrates: "18g",
        vitamins: ["A", "D"]
      }
    },
    {
      title: "Fish and Rice Porridge",
      category: "7-12 months",
      imageUrl: "https://example.com/fish-rice.jpg",
      ingredients: [
        { name: "Fish (deboned)", quantity: "2 tbsp" },
        { name: "Rice", quantity: "1/4 cup" },
        { name: "Water", quantity: "1 cup" }
      ],
      steps: [
        "Cook the rice in water until very soft.",
        "Add cooked, mashed fish.",
        "Mix together to form a porridge."
      ],
      nutrition: {
        calories: "180 kcal",
        proteins: "8g",
        carbohydrates: "28g",
        vitamins: ["D", "B12"]
      }
    },
    
    // 1-2 years category
    {
      title: "Lentil Soup with Carrot",
      category: "1-2 years",
      imageUrl: "https://example.com/lentil-soup.jpg",
      ingredients: [
        { name: "Lentils", quantity: "1/4 cup" },
        { name: "Carrot", quantity: "1 small" },
        { name: "Water", quantity: "1 cup" }
      ],
      steps: [
        "Cook lentils and carrots together until soft.",
        "Blend to make a smooth soup.",
        "Serve warm."
      ],
      nutrition: {
        calories: "90 kcal",
        proteins: "4g",
        carbohydrates: "15g",
        vitamins: ["A", "C"]
      }
    },
    {
      title: "Chicken and Vegetable Rice",
      category: "1-2 years",
      imageUrl: "https://example.com/chicken-veg-rice.jpg",
      ingredients: [
        { name: "Chicken breast", quantity: "1/4 cup" },
        { name: "Rice", quantity: "1/4 cup" },
        { name: "Mixed vegetables", quantity: "1/4 cup" }
      ],
      steps: [
        "Cook chicken and vegetables together.",
        "Serve over soft-cooked rice.",
        "Mash slightly if needed."
      ],
      nutrition: {
        calories: "200 kcal",
        proteins: "10g",
        carbohydrates: "25g",
        vitamins: ["A", "C", "D"]
      }
    },
    {
      title: "Pumpkin and Sweet Corn Puree",
      category: "1-2 years",
      imageUrl: "https://example.com/pumpkin-sweetcorn.jpg",
      ingredients: [
        { name: "Pumpkin", quantity: "1/4 cup" },
        { name: "Sweet corn", quantity: "1/4 cup" }
      ],
      steps: [
        "Boil pumpkin and corn together.",
        "Blend or mash to create a puree.",
        "Serve warm."
      ],
      nutrition: {
        calories: "110 kcal",
        proteins: "3g",
        carbohydrates: "22g",
        vitamins: ["A", "C"]
      }
    },
  
    // 2-3 years category
    {
      title: "Mini Pancakes with Fruit",
      category: "2-3 years",
      imageUrl: "https://example.com/mini-pancakes.jpg",
      ingredients: [
        { name: "Flour", quantity: "1/4 cup" },
        { name: "Milk", quantity: "1/4 cup" },
        { name: "Egg", quantity: "1" },
        { name: "Banana", quantity: "1/2" }
      ],
      steps: [
        "Mix flour, milk, and egg into a batter.",
        "Make small pancakes in a non-stick pan.",
        "Serve with mashed banana or berries."
      ],
      nutrition: {
        calories: "180 kcal",
        proteins: "6g",
        carbohydrates: "30g",
        vitamins: ["B1", "C"]
      }
    },
    {
      title: "Scrambled Eggs with Spinach",
      category: "2-3 years",
      imageUrl: "https://example.com/scrambled-eggs-spinach.jpg",
      ingredients: [
        { name: "Egg", quantity: "1" },
        { name: "Spinach", quantity: "1/4 cup" },
        { name: "Butter", quantity: "1 tsp" }
      ],
      steps: [
        "Scramble egg in butter.",
        "Add chopped spinach and cook until wilted.",
        "Serve with toast or mashed potatoes."
      ],
      nutrition: {
        calories: "150 kcal",
        proteins: "8g",
        carbohydrates: "5g",
        vitamins: ["A", "C", "D"]
      }
    },
  
    // 3-4 years category
    {
      title: "Vegetable Pasta",
      category: "3-4 years",
      imageUrl: "https://example.com/vegetable-pasta.jpg",
      ingredients: [
        { name: "Pasta", quantity: "1/2 cup" },
        { name: "Carrot", quantity: "1 small" },
        { name: "Tomato sauce", quantity: "1/4 cup" }
      ],
      steps: [
        "Cook pasta until soft.",
        "Add finely chopped and cooked vegetables.",
        "Mix with tomato sauce and serve."
      ],
      nutrition: {
        calories: "250 kcal",
        proteins: "7g",
        carbohydrates: "35g",
        vitamins: ["A", "C"]
      }
    },
    {
      title: "Rice and Fish",
      category: "3-4 years",
      imageUrl: "https://example.com/rice-fish.jpg",
      ingredients: [
        { name: "Rice", quantity: "1/2 cup" },
        { name: "Fish (boneless)", quantity: "1/4 cup" }
      ],
      steps: [
        "Cook rice until soft.",
        "Grill or steam the fish.",
        "Serve rice with fish and vegetables."
      ],
      nutrition: {
        calories: "230 kcal",
        proteins: "10g",
        carbohydrates: "30g",
        vitamins: ["D", "B12"]
      }
    },
  
    // 4-5 years category
    {
      title: "Omelette with Cheese",
      category: "4-5 years",
      imageUrl: "https://example.com/omelette-cheese.jpg",
      ingredients: [
        { name: "Egg", quantity: "2" },
        { name: "Cheese", quantity: "1/4 cup" },
        { name: "Butter", quantity: "1 tsp" }
      ],
      steps: [
        "Beat the eggs and cook in a non-stick pan.",
        "Sprinkle cheese on top and fold the omelette.",
        "Serve warm."
      ],
      nutrition: {
        calories: "250 kcal",
        proteins: "12g",
        carbohydrates: "3g",
        vitamins: ["A", "D"]
      }
    },
    {
      title: "Chicken and Rice Bowl",
      category: "4-5 years",
      imageUrl: "https://example.com/chicken-rice.jpg",
      ingredients: [
        { name: "Chicken breast", quantity: "1/4 cup" },
        { name: "Rice", quantity: "1/4 cup" },
        { name: "Broccoli", quantity: "1/4 cup" }
      ],
      steps: [
        "Cook chicken, rice, and broccoli separately.",
        "Combine them in a bowl and serve with a sauce of your choice."
      ],
      nutrition: {
        calories: "220 kcal",
        proteins: "15g",
        carbohydrates: "30g",
        vitamins: ["A", "C"]
      }
    },
    {
      title: "Fruit Smoothie",
      category: "4-5 years",
      imageUrl: "https://example.com/fruit-smoothie.jpg",
      ingredients: [
        { name: "Banana", quantity: "1" },
        { name: "Milk", quantity: "1/2 cup" },
        { name: "Berries", quantity: "1/4 cup" }
      ],
      steps: [
        "Blend banana, milk, and berries together until smooth.",
        "Serve immediately."
      ],
      nutrition: {
        calories: "150 kcal",
        proteins: "5g",
        carbohydrates: "30g",
        vitamins: ["C", "D"]
      }
    }
    // Add more if needed...
  ];

  export default mealsList;


//   import { View, Text } from 'react-native';

// import React from 'react';
// import { Button } from 'react-native';
// import { db } from '../../lib/firebase'; // Your Firebase config
// import mealsList from '../../components/meallist';  // Import your meals list
// import { collection, doc, writeBatch } from 'firebase/firestore';  // Import necessary Firestore functions

// const Mealbank = () => {
//   const handleSubmit = async () => {
//     try {
//       const batch = writeBatch(db);  // Create a batch instance

//       mealsList.forEach((meal) => {
//         const mealRef = doc(collection(db, 'mealbank'));  // Create a reference to a new document in the "mealbank" collection
//         batch.set(mealRef, meal);  // Add the meal to the batch
//       });

//       await batch.commit();  // Commit the batch to Firestore
//       console.log('Meals added successfully');
//     } catch (error) {
//       console.error('Error adding meals: ', error);
//     }
//   };

//   return (
//     <SafeAreaView>
//       <View>
//         <Button title="Submit All Meals" onPress={handleSubmit} />
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Mealbank;