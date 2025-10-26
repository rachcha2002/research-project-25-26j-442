import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDocs, collection, query, where } from "firebase/firestore"; // Firestore import for fetching baby data
import { db } from "../lib/firebase"; // Adjust the path to your firebase config

// Create the GlobalContext
const GlobalContext = createContext();

// Create a custom hook to use the GlobalContext
export const useGlobalContext = () => useContext(GlobalContext);

// GlobalProvider component to wrap your app with global state
const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Boolean flag for login state
  const [user, setUser] = useState({
    name: null,
    email: null,
    imageUrl: null,
  }); // Store name, email, imageUrl in the user state
  const [isLoading, setIsLoading] = useState(true); // Loading state for app initialization or session checking
  const [currentBaby, setCurrentBaby] = useState(null); // State for current baby (storing baby name)
  const [babies, setBabies] = useState([]); // Store all babies for the user

  // Load user data from AsyncStorage and parse the token
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedSession = await AsyncStorage.getItem("userSession");

        if (storedSession) {
          const sessionData = JSON.parse(storedSession);

          // Check if the session contains valid user data
          if (
            sessionData &&
            sessionData.user &&
            sessionData.user.user_metadata
          ) {
            const { user_metadata } = sessionData.user; // Extract user_metadata from the token

            // Extract and assign the necessary fields
            const name = user_metadata.full_name || "Unknown Name";
            const email = user_metadata.email || "Unknown Email";
            const imageUrl = user_metadata.avatar_url || "default_avatar_url";

            // Set user data in Context
            setUser({ name, email, imageUrl });
            setIsLoggedIn(true);

            // Fetch the user's babies from Firestore and set the first baby as current
            await fetchBabiesAndSetCurrentBaby(email);
          } else {
            //console.warn("No user metadata found in the session.");
          }
        } else {
          console.log("No session data found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error loading user data from storage:", error);
      } finally {
        setIsLoading(false); // Stop loading when done
      }
    };

    loadUserData();
  }, []);

  // Fetch all babies associated with the user's email and set the first as current
  const fetchBabiesAndSetCurrentBaby = async (userEmail) => {
    try {
      console.log("Fetching babies for email:", userEmail);
      const babyQuery = query(
        collection(db, "babyProfiles"),
        where("userMail", "==", userEmail)
      );
      const querySnapshot = await getDocs(babyQuery);

      const babyList = querySnapshot.docs.map((doc) => doc.data());

      setBabies(babyList);

      // Set the first baby's name as the default current baby
      if (babyList.length > 0) {
        const firstBabyName = babyList[0].babyName;
        setCurrentBaby(firstBabyName);
        console.log("Current baby set to:", firstBabyName); // Log the current baby when set initially
      } else {
        console.warn("No babies found for this user.");
      }
    } catch (error) {
      console.error("Error fetching babies:", error);
    }
  };

  // Function to change the current baby (store baby name instead of object)
  const changeCurrentBaby = (babyName) => {
    setCurrentBaby(babyName);
    console.log("Baby changed to:", babyName); // Log when the baby is changed
  };

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        isLoading,
        setIsLoading,
        babies, // Provide babies to the context
        setBabies, // Provide the setter for babies
        currentBaby, // Provide currentBaby (baby name) to the context
        setCurrentBaby, // Provide the setter for currentBaby
        changeCurrentBaby, // Provide function to change current baby
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
