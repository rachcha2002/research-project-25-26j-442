import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { View, TouchableOpacity, Text, Alert, Image } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage to handle session
import { useGlobalContext } from "../../context/GlobalProvider"; // Use the context to access user state
import { icons, images } from "../../constants";
import InfoBox from "../../components/InfoBox"; // Import icons
import BabyProfileList from "./babyprofiles";
import { Ionicons } from "@expo/vector-icons";

const Profile = () => {
  const { setUser, user } = useGlobalContext(); // Access the setUser function to update the state

  // Handle logout
  const handleLogout = async () => {
    try {
      // Remove the session from AsyncStorage
      await AsyncStorage.removeItem("userSession");

      // Clear the user state
      setUser(null);

      // Redirect to the root (login) page
      router.push("/");
    } catch (error) {
      Alert.alert("Logout failed", "An error occurred while logging out.");
      console.error("Error logging out:", error);
    }
  };

  const navigateHome = () => {
    router.push("/home");
  };

  return (
    <SafeAreaView className="bg-white h-full">

      <View className="flex-row items-center justify-between px-4 mt-4">

        {/* Back Button */}
        <TouchableOpacity onPress={() => router.push("/home")}>
          <Image
            source={icons.backarrow} // Replace with the correct path for the back arrow icon
            className="w-8 h-8"
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Centered Logo */}
        <TouchableOpacity
          onPress={navigateHome}
          style={{ flex: 1, alignItems: "center" }}
        >
          <Image
            source={images.peditracklogo} // Replace with the correct path for your logo
            className="w-28 h-10"
            resizeMode="contain"
          />
        </TouchableOpacity>


        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout}>
          <Image
            source={icons.logout}
            resizeMode="contain"
            className="w-7 h-7"
          />
        </TouchableOpacity>
      </View>

      {/* User Info Section */}

      <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
        <View className="w-16 h-16 border border-green-950 rounded-lg flex justify-center items-center">
          <Image
            source={{ uri: user?.imageUrl }}
            className="w-[90%] h-[90%] rounded-lg"
            resizeMode="cover"
          />
        </View>

        <InfoBox
          title={user?.name}
          subtitle={user?.email}
          containerStyles="mt-5"
          titleStyles="text-lg"
        />
      </View>

      {/* Baby Profile List */}
      <View className="flex-1">
        <BabyProfileList />
        <TouchableOpacity
          onPress={() => {
            router.push("/profile/babyprofileform");
          }}
          style={{

            margin: 16, // Add margin around the button
            height: 40, // Set height equal to width
            backgroundColor: "#6C63FF", // Add a background color
            justifyContent: "center", // Center the text vertically
            alignItems: "center", // Center the text horizontally
            borderRadius: 10, // Rounded corners
            shadowColor: "#000", // Shadow for depth

            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
            Add Baby Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
