import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SubScreenHeader from '../../components/SubScreenHeader'; // Adjust the import path as necessary
import { images } from '../../constants'; // Adjust the import path as necessary

const TipsIllnessFeeding = () => {
  return (
    <SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
        <SubScreenHeader title="Feeding Your Child During Illness" goBackPath="/feeding/tips" />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        
        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Main Content Container */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderRadius: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}>
            {/* Article Title Section */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333333', marginBottom: 16 }}>
                How to Feed a Child During Illness
              </Text>
              <View style={{ width: '100%', height: 1, backgroundColor: '#cccccc', marginBottom: 16 }} />
            </View>

            {/* Article Content */}
            <View>
              {/* Text Block 1 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Feeding a child during illness can be challenging, as the child may have a reduced appetite or feel too uncomfortable to eat. However, providing proper nutrition during this period is essential to support the child’s recovery and maintain their growth. The key is to feed the child patiently and in small amounts, frequently throughout the day. Ensure that meals are easy to digest and rich in essential nutrients.
              </Text>

              {/* Image */}
              <Image
                source={images.illnessFeeding} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic', marginBottom: 16 }}>Carefully feeding a sick child</Text>

              {/* Text Block 2 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Offer the child foods that are nutritious, soft, and easy to swallow. Some suitable options include soft rice, mashed vegetables, soups, and foods with a mild taste. Including proteins like eggs, chicken, or fish can provide the energy the child needs. You can also add oils, butter, or coconut milk to increase the energy content of the meals.
              </Text>

              {/* Text Block 3 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                If the child has a fever, manage the fever first, as a child who feels hot or feverish will likely refuse food. Once the fever is under control, offer small portions of food at frequent intervals. Breastfeeding should continue during illness as it provides both comfort and vital nutrients for the child.
              </Text>

              {/* Text Block 4 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                It is important to maintain hydration, especially if the child is experiencing diarrhea or vomiting. Offer sips of boiled, cooled water or rehydration solutions between meals to prevent dehydration. Avoid giving sugary drinks or sodas, as they may worsen dehydration.
              </Text>

              {/* Text Block 5 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                After the child recovers from the illness, it is important to provide extra meals and snacks for about two weeks to help them regain any lost weight and replenish their energy levels. Include nutrient-rich foods like eggs, fish, and fruits in their diet. Continue feeding with patience and love, making mealtime a calm and comfortable experience for the child.
              </Text>

              {/* Author and Date */}
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 14, color: '#777777', textAlign: 'right' }}>By Health Editor</Text>
                <Text style={{ fontSize: 14, color: '#777777', textAlign: 'right' }}>Published on September 17, 2024</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TipsIllnessFeeding;
