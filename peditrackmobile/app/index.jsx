import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { supabase } from "../lib/supabase"; // Your Supabase client setup
import { router } from "expo-router"; // Import the router from expo-router
import { useGlobalContext } from "../context/GlobalProvider"; // Import your Global Context
import { icons, images } from "../constants";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../lib/firebase"; // Firebase config
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const {
    setUser: setGlobalUser,
    setIsLoggedIn,
    setBabies,
    setCurrentBaby,
  } = useGlobalContext(); // Access the context's functions
  const [isLoading, setIsLoading] = useState(true); // To manage loading state while fetching the session

  useEffect(() => {
    // Request notification permissions on app load
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission for notifications was not granted!");
      }
    };
    requestPermissions();
  }, []);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Function to load and validate session from AsyncStorage
  const loadSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");

      if (session) {
        const parsedSession = JSON.parse(session);

        // Use the stored user metadata
        setGlobalUser({
          name: parsedSession.full_name || "Unknown User", // Use full_name from storage
          email: parsedSession.email,
          imageUrl: parsedSession.avatar_url, // Use avatar_url from storage
        });
        setIsLoggedIn(true);

        // Fetch babies and set the current baby
        await fetchBabiesAndSetCurrentBaby(parsedSession.email); // Call the function after setting the user

        // Navigate to the home page
        router.push("/home"); // Redirect to the home page
      } else {
        // No session found, allow sign-in
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to load session from storage:", err);
      setIsLoading(false);
    }
  };

  // Fetch babies and set current baby
  const fetchBabiesAndSetCurrentBaby = async (userEmail) => {
    try {
      const babyQuery = query(
        collection(db, "babyProfiles"),
        where("userMail", "==", userEmail)
      );
      const querySnapshot = await getDocs(babyQuery);
      const babyList = querySnapshot.docs.map((doc) => doc.data());

      setBabies(babyList); // Set all babies in the context

      if (babyList.length > 0) {
        setCurrentBaby(babyList[0].babyName); // Set the first baby as the current baby
        console.log("Current baby set to:", babyList[0].babyName); // Log the current baby
      } else {
        console.warn("No babies found for this user.");
      }
    } catch (error) {
      console.error("Error fetching babies:", error);
    }
  };

  // Load session on app start
  useEffect(() => {
    loadSession();
  }, []);

  // Handle deep link and set the session after Google sign-in
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const { url } = event;

      const params = new URLSearchParams(url.split("#")[1]); // Extracting the fragment part of the URL (after #)
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken) {
        // Store tokens in Supabase and handle the session manually
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error setting session:", error.message);
          setIsLoading(false); // Stop loading on failure
        } else {
          const user = data.session.user;
          // Save session to AsyncStorage including user metadata
          await AsyncStorage.setItem(
            "userSession",
            JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              full_name: user.user_metadata.full_name, // Store full_name
              email: user.email,
              avatar_url: user.user_metadata.avatar_url, // Store avatar_url
            })
          );

          // Set user data in GlobalContext
          setGlobalUser({
            name: user.user_metadata.full_name,
            email: user.email,
            imageUrl: user.user_metadata.avatar_url,
          });

          // Fetch babies and set the current baby
          await fetchBabiesAndSetCurrentBaby(user.email); // Fetch babies after setting user

          setIsLoggedIn(true); // Mark user as logged in

          // Navigate to the home page after receiving the token
          router.push("/profile/onboarding"); // Redirect to the home page
        }
      } else {
        setIsLoading(false); // No access token found, allow login
      }
    };

    // Add an event listener for deep linking
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Clean up the event listener
    return () => {
      subscription.remove();
    };
  }, []);

  // Handle Google OAuth login
  const signInWithGoogle = async () => {
    setIsLoading(true); // Start loading

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: 'peditrack://home', // Your development redirect URI
      },
    });
    //'peditrack://home'
    if (error) {
      console.error("Error signing in with Google:", error.message);
      setIsLoading(false); // Stop loading on failure
    } else if (data) {
      // Open the Google OAuth URL with Linking
      Linking.openURL(data.url);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      {/* Logo Section */}
      <View className="items-center justify-center mb-16">
        <Image
          source={images.peditracklogo} // Replace with your actual logo path
          className="w-80 h-28 object-contain" // Adjusted the size for a larger logo
          resizeMode="contain"
        />
        <Text className="text-center mt-20 text-lg italic text-gray-800 font-bold">
          A Healthier Future Begins Today with
        </Text>
        <Text className="text-center text-xl italic text-purple-700 font-bold">
          PediTrack
        </Text>
      </View>

      {/* Google Sign-in Button */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#7360F2" /> // Show loading indicator
      ) : (
        <TouchableOpacity
          onPress={signInWithGoogle}
          className="flex-row items-center px-6 py-3 bg-purple-500 rounded-full shadow-lg"
        >
          <Image
            source={icons.google} // Replace with the actual Google logo path
            className="w-6 h-6 mr-3"
          />
          <Text className="text-white text-lg font-semibold">
            Continue with Google
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
