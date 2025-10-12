import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SubScreenHeader from '../../components/SubScreenHeader'; // Adjust the import path as necessary
import { images } from '../../constants'; // Adjust the import path as necessary

const TipsSnack = () => {
  return (
    <SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
        <SubScreenHeader title="Importance of snacks for babies." goBackPath="/feeding/tips" />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        
        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Main Content Container */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderRadius: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}>
            {/* Article Title Section */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333333', marginBottom: 16 }}>
                Why are snacks important for babies?
              </Text>
              <View style={{ width: '100%', height: 1, backgroundColor: '#cccccc', marginBottom: 16 }} />
            </View>

            {/* Article Content */}
            <View>
              {/* Text Block 1 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Snacks are an essential part of a baby's diet, as they provide additional energy and nutrients needed for growth and development. Between main meals, giving babies small, nutritious snacks helps meet their daily dietary requirements, especially when they are active and growing rapidly. Examples include boiled eggs, pieces of boiled potatoes with butter, or small pieces of fruit. 
              </Text>

              {/* Image 1 */}
              <Image
                source={images.snacktime} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic', marginBottom: 16 }}>Baby Enjoying Snack</Text>

              {/* Text Block 2 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Offering 1-2 snacks a day, based on the baby's hunger cues and weight gain, ensures the baby gets extra energy without overwhelming their appetite for main meals. These snacks can also introduce different textures and tastes, which are important as the baby grows. Finger foods like pieces of soft fruits or hoppers also encourage self-feeding.
              </Text>

              {/* Image 2 */}
              <Image
                source={images.babyselffeed} // Ensure this image path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic' }}>Various Baby Snacks</Text>

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

export default TipsSnack;
