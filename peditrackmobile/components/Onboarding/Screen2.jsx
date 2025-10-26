import React from 'react';
import { View, Text, Image } from 'react-native';
import { images } from '../../constants';

const Screen2 = ({ logo, image }) => {
  return (
    <View className="flex-1 items-center justify-center bg-[#7360F2] p-6">
      <Image source={images.peditracklogo} className="w-30 h-20 mb-4" resizeMode="contain" />
      <Text className="text-white text-4xl font-bold mb-6">Track</Text>
      <Image source={images.screen2} className="w-64 h-64 mb-6" />
      <Text className="text-white text-lg text-center">
        Your Baby’s Vaccination Routine
      </Text>
      
    </View>
  );
};

export default Screen2;
