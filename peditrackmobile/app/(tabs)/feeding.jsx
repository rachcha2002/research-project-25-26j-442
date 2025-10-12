import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { useGlobalContext } from "../../context/GlobalProvider";
import { icons, images } from "../../constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MainHeader from "../../components/MainHeader";
import { Colors } from "../../constants/colors";

const Feeding = () => {
  const { user } = useGlobalContext();

  const navigateToTips = () => {
    router.push("/feeding/tips");
  };

  const navigateToMealReminder = () => {
    router.push("/feeding/mealreminder");
  };

  const navigateToBreastFeedPlanner = () => {
    router.push("/feeding/breastfeedplanner");
  };

  const navigateToMealBank = () => {
    router.push("/feeding/mealbank");
  };

  const navigateToMealPlanner = () => {
    router.push("/feeding/mealplanner");
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView className="flex-1 bg-white">
        <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
        {/* Header */}
        <MainHeader title="Feeding Planner" />

        {/* Content */}
        <View className="p-4 space-y-4">
          {/* Meal Planner */}
          <View className="bg-white border border-[#9095A1] rounded-lg p-4 flex-row justify-between items-center mt-2 mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-lg font-semibold text-black">
                Meal Planner
              </Text>
              <Text className="text-gray-600">
                Organize your baby's meals efficiently with the meal planner.
              </Text>
              <View className="flex-row mt-2 space-x-2">
                <TouchableOpacity
                  className="border border-[#7360F2] px-3 py-1 rounded-full"
                  onPress={navigateToMealPlanner}
                >
                  <Text className="text-[#7360F2]">Plan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="border border-[#7360F2] px-3 py-1 rounded-full"
                  onPress={navigateToTips}
                >
                  <Text className="text-[#7360F2]">Feeding Tips</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={images.mealplanner}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
          </View>

          {/* Meal Reminder */}
          <View className="bg-white border border-[#9095A1] rounded-lg p-4 flex-row justify-between items-center mt-2 mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-lg font-semibold text-black">
                Meal Reminder
              </Text>
              <Text className="text-gray-600">
                Easily set and manage meal reminders for your baby.
              </Text>
              <View className="flex-row mt-2 space-x-2">
                <TouchableOpacity
                  className="border border-[#7360F2] px-3 py-1 rounded-full"
                  onPress={navigateToMealReminder}
                >
                  <Text className="text-[#7360F2]">Set Reminder</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={images.mealreminder}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
          </View>

          {/* Meal Bank */}
          <View className="bg-white border border-[#9095A1] rounded-lg p-4 flex-row justify-between items-center mt-2 mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-lg font-semibold text-black">
                Meal Bank
              </Text>
              <Text className="text-gray-600">
                Access a variety of nutritious meal plans for your baby.
              </Text>
              <View className="flex-row mt-2 space-x-2">
                <TouchableOpacity
                  className="border border-[#7360F2] px-3 py-1 rounded-full"
                  onPress={navigateToMealBank}
                >
                  <Text className="text-[#7360F2]">Explore Now</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={images.mealbank}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
          </View>

          {/* Breastfeeding Plan */}
          <View className="bg-white border border-[#9095A1] rounded-lg p-4 flex-row justify-between items-center mt-2">
            <View className="flex-1 mr-4">
              <Text className="text-lg font-semibold text-black">
                Breastfeeding Plan
              </Text>
              <Text className="text-gray-600">
                Create a personalized breastfeeding plan.
              </Text>
              <View className="flex-row mt-2 space-x-2">
                <TouchableOpacity
                  className="border border-[#7360F2] px-3 py-1 rounded-full"
                  onPress={navigateToBreastFeedPlanner}
                >
                  <Text className="text-[#7360F2]">Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={images.breastfeeding}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Feeding;
