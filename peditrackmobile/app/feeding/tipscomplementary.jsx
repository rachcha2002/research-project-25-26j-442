import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SubScreenHeader from '../../components/SubScreenHeader'; // Adjust the import path as necessary
import { images } from '../../constants'; // Adjust the import path as necessary

const TipsComplementary = () => {
  return (
    <SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
        <SubScreenHeader title="Understanding Complementary Feeding" goBackPath="/feeding/tips" />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        
        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Main Content Container */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderRadius: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}>
            {/* Article Title Section */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333333', marginBottom: 16 }}>
                What is Complementary Feeding?
              </Text>
              <View style={{ width: '100%', height: 1, backgroundColor: '#cccccc', marginBottom: 16 }} />
            </View>

            {/* Article Content */}
            <View>
              {/* Text Block 1 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Complementary feeding is the introduction of solid and semi-solid foods to a baby’s diet, in addition to breast milk, from the age of 6 months. While breast milk continues to provide essential nutrients, it alone is no longer sufficient to meet the growing energy and nutrient needs of a baby. Complementary foods offer the additional nutrients necessary for proper growth, brain development, and health from 6 months onward.
              </Text>

              {/* Image 1 */}
              <Image
                source={images.complementaryFeeding} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic', marginBottom: 16 }}>Introduction to complementary feeding</Text>

              {/* Text Block 2 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                The process of complementary feeding begins gradually, starting with 2-3 teaspoons of semi-solid foods such as mashed rice mixed with breast milk. This helps the baby adjust to new tastes and textures. Over time, new foods such as pulses (dhal, green gram), fruits, and animal-based foods like dried sprats, fish, or chicken are introduced to the diet. It is important to introduce one new food at a time, over 2-3 days, to monitor the baby’s reaction and allow them to get used to the flavors.
              </Text>

              {/* Image 2 */}
              <Image
                source={images.babyFirstFood} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic' }}>Baby's first complementary foods</Text>

              {/* Text Block 3 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Complementary foods should be prepared hygienically, with the baby’s own plate, bowl, and spoon, and in a designated feeding area. The food should be semi-solid and familiar at first, and gradually progress to more textured meals as the baby grows. Iron-rich foods like chicken, fish, and sprats are vital during this phase as they contribute to the formation of hemoglobin, which ensures oxygen reaches the brain and supports growth and development.
              </Text>

              {/* Image 3 */}
              <Image
                source={images.ironRichFood} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic' }}>Iron-rich foods for healthy growth</Text>

              {/* Text Block 4 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                During complementary feeding, variety is key. Babies should be exposed to different types of food to ensure they get a wide range of nutrients. This also helps them develop the habit of eating different foods as they grow. Foods like mashed vegetables, fruits, and animal-based foods should be given in rotation to ensure a balanced diet. Small amounts of oil, butter, or thick coconut milk can be added to meals to boost their energy content, making them more suitable for a growing baby.
              </Text>

              {/* Image 4 */}
              <Image
                source={images.varietyFood} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic' }}>Variety of foods for balanced nutrition</Text>

              {/* Text Block 5 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                It's also important to maintain breastfeeding during the complementary feeding period, up to two years or beyond. Breastfeeding continues to provide essential nutrients and emotional bonding. Complementary feeding should be a time of interaction between the caregiver and baby. Talking, maintaining eye contact, and creating a calm feeding environment all contribute to a baby’s learning and brain development during meals.
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

export default TipsComplementary;
