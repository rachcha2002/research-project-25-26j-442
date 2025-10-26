import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons, images } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import SubScreenHeader from "../../components/SubScreenHeader";

const FeedingTips = () => {
  const { user } = useGlobalContext();
  const navigation = useNavigation();

  const navigateMeat = () => {
    router.push("/feeding/tipsmeat");
  };

  const navigateSnacks = () => {
    router.push("/feeding/tipssnacks");
  }
  const navigateComplementary = () => {
    router.push("/feeding/tipscomplementary");
  }
  const navigateIllness = () => {
    router.push("/feeding/tipsillnessfeeding");
  }

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView className="flex-1 bg-white">
        <SubScreenHeader title="Feeding Tips & Guide" goBackPath={"/feeding"} />

        {/* Content */}
        <View className="p-4">
          <View className="flex-row flex-wrap justify-between">
            {/* Card 1 */}
            <View className="bg-white border border-[#6256B1] rounded-lg p-4 mb-4 w-[48%] h-64">
              <Image
                source={images.tipsnacks} // Replace with the correct path for the image
                className="w-full h-24 rounded-lg"
                resizeMode="cover"
              />
              <Text className="mt-2 text-center font-semibold text-black flex-1">
                Why Snacks are needed?
              </Text>
              <TouchableOpacity className="border border-[#6256B1] mt-4 py-2 rounded-full" onPress={navigateSnacks}>
                <Text className="text-center text-[#6256B1]">Learn More</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2 */}
            <View className="bg-white border border-[#6256B1] rounded-lg p-4 mb-4 w-[48%] h-64">
              <Image
                source={images.tipsill} // Replace with the correct path for the image
                className="w-full h-24 rounded-lg"
                resizeMode="cover"
              />
              <Text className="mt-2 text-center font-semibold text-black flex-1">
                How to feed child during illness?
              </Text>
              <TouchableOpacity className="border border-[#6256B1] mt-4 py-2 rounded-full" onPress={navigateIllness}>
                <Text className="text-center text-[#6256B1]">Learn More</Text>
              </TouchableOpacity>
            </View>

            {/* Card 3 */}
            <View className="bg-white border border-[#6256B1] rounded-lg p-4 mb-4 w-[48%] h-64">
              <Image
                source={images.tipscomplementary} // Replace with the correct path for the image
                className="w-full h-24 rounded-lg"
                resizeMode="cover"
              />
              <Text className="mt-2 text-center font-semibold text-black flex-1">
                Introduce complementary foods to baby
              </Text>
              <TouchableOpacity
                className="border border-[#6256B1] mt-4 py-2 rounded-full"
                onPress={navigateComplementary}
              >
                <Text className="text-center text-[#6256B1]">Learn More</Text>
              </TouchableOpacity>
            </View>

            {/* Card 4 */}
            <View className="bg-white border border-[#6256B1] rounded-lg p-4 mb-4 w-[48%] h-64">
              <Image
                source={images.tipmeat} // Replace with the correct path for the image
                className="w-full h-24 rounded-lg"
                resizeMode="cover"
              />
              <Text className="mt-2 text-center font-semibold text-black flex-1">
                Why is it important to give animal foods to the babies?
              </Text>
              <TouchableOpacity className="border border-[#6256B1] mt-4 py-2 rounded-full" onPress={navigateMeat}>
                <Text className="text-center text-[#6256B1]">Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeedingTips;
