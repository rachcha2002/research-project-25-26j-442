import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SubScreenHeader from '../../components/SubScreenHeader'; // Adjust the import path as necessary
import { images } from '../../constants'; // Adjust the import path as necessary

const TipsMeat = () => {
  return (
    <SafeAreaView style={{ backgroundColor: '#ffffff', flex: 1 }}>
        <SubScreenHeader title="Importance of feeding animal foods." goBackPath="/feeding/tips" />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        

        {/* Content */}
        <View style={{ padding: 16 }}>
          {/* Main Content Container */}
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cccccc', borderRadius: 10, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 }}>
            {/* Article Title Section */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333333', marginBottom: 16 }}>
                Why is it important to give animal foods?
              </Text>
              <View style={{ width: '100%', height: 1, backgroundColor: '#cccccc', marginBottom: 16 }} />
            </View>

            {/* Article Content */}
            <View>
              {/* Text Block 1 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Animal-based foods are important for a baby's growth & development, especially during early complementary feeding, such as Days 7-9. Foods like powdered dried sprats, fish, or chicken provide essential proteins, vitamins, and minerals that help support brain development, which is rapid during the first two years. The iron in animal foods helps form hemoglobin, ensuring oxygen reaches the brain and body for energy and growth.
              </Text>

              {/* Image 1 */}
              <Image
                source={images.babybrain} // Make sure this path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic', marginBottom: 16 }}>Brain development illustration</Text>

              {/* Text Block 2 */}
              <Text style={{ textAlign: 'justify', color: '#555555', lineHeight: 24, marginBottom: 16 }}>
                Additionally, nutrients like zinc and vitamin B12 support the immune system and overall development. To increase energy content, meals can be enriched with oil, butter, or coconut milk, while continuing to offer mashed fruits and breastfeeding.
              </Text>

              {/* Image 2 */}
              <Image
                source={images.babyfeed} // Make sure this path is correct
                style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', fontStyle: 'italic' }}>Baby feeding illustration</Text>

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

export default TipsMeat;
