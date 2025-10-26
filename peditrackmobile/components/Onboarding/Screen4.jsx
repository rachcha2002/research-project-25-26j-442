import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { images } from '../../constants';
import { useRouter } from 'expo-router';

const Screen4 = () => {
  const router = useRouter(); // Get the router instance

  return (
    <View className="flex-1 items-center justify-center bg-[#7360F2] p-6">
      <Image source={images.peditracklogo} className="w-30 h-20 mb-4" resizeMode="contain" />
      <Text className="text-white text-4xl font-bold mb-6">Locate</Text>
      <Image source={images.screen4} className="w-64 h-64 mb-6" />
      <Text className="text-white text-lg text-center mb-4">
        Nearest Health Facilities near you in an emergency
      </Text>

      {/* Button to Navigate to Home */}
      <TouchableOpacity
        onPress={() => router.push('/home')}
        className="bg-white p-4 rounded-lg mt-6 shadow-md"
      >
        <Text className="text-purple-500 font-bold text-lg">Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Screen4;
