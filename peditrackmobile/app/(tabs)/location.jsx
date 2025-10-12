import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";
import { UserLocationContext } from "../../context/UserLocationContext";
import GlobalAPI from "../../services/GlobalAPI";
import MainHeader from "../../components/MainHeader";
import CategoryList from "../location/CategoryList";
import GoogleMapView from "../location/GoogleMapView";
import LocationList from "../location/LocationList";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";

const LocationScreen = () => {
  const [selectedFacility, setSelectedFacility] = useState("hospital");
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationList, setLocationList] = useState([]);
  const [placeList, setPlaceList] = useState([]);

  // New States for Search Functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredLocationList, setFilteredLocationList] = useState([]);

  // State to track the selected location for map centering
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }
        let userLocation = await Location.getCurrentPositionAsync({});
        setLocation(userLocation);
      } catch (error) {
        console.log("Error getting location: ", error);
        setErrorMsg("Could not fetch location");
      }
    })();
  }, []);

  // Fetch places based on user location
  useEffect(() => {
    if (location) {
      const GetNearbySearchPlace = async (value) => {
        try {
          console.log(
            "Location is available:",
            location.coords.latitude,
            location.coords.longitude
          );
          const resp = await GlobalAPI.nearByPlace(
            location.coords.latitude,
            location.coords.longitude,
            value
          );
          console.log("API Response:", resp);
          if (resp.data.status === "OK" && Array.isArray(resp.data.results)) {
            console.log("Google API Response:", resp.data.results);
            setLocationList(resp.data.results);
          } else {
            console.log("Google API Error:", resp.data.status);
            setLocationList([]);
          }
          const response = await GlobalAPI.searchByText(value).then(
            (response) => {
              setPlaceList(response.data.results);
            }
          );
        } catch (error) {
          console.log("Error fetching places:", error);
          setLocationList([]);
        }
      };

      GetNearbySearchPlace(selectedFacility);
    }
  }, [location, selectedFacility]);

  // Filter locationList based on searchQuery
  useEffect(() => {
    if (searchQuery) {
      const filtered = locationList.filter((place) => {
        const query = searchQuery.toLowerCase();
        const nameMatch = place.name.toLowerCase().includes(query);
        const vicinityMatch = place.vicinity.toLowerCase().includes(query);
        return nameMatch || vicinityMatch;
      });
      setFilteredLocationList(filtered);
    } else {
      setFilteredLocationList(locationList);
    }
  }, [searchQuery, locationList]);

  // Handle selection of a location
  const onSelectLocation = (place) => {
    setSelectedLocation(place);
  };

  // Function to clear search query
  const clearSearch = () => {
    setSearchQuery(""); // Reset the search input when the modal closes
  };

  // Render error message if it exists
  if (errorMsg) {
    return <Text>{errorMsg}</Text>;
  }

  if (!location) {
    return <Text>Loading location...</Text>;
  }

  return (
    <SafeAreaView className="bg-white h-full flex-1">
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />
      <MainHeader title="Nearest Health Facilities" />
      <FlatList
        data={filteredLocationList}
        keyExtractor={(item) => item.place_id}
        ListHeaderComponent={
          <>
            {/* Header */}

            <UserLocationContext.Provider value={{ location, setLocation }}>
              {/* Search Bar */}
              <View style={styles.searchSection}>
                <Icon
                  name="search"
                  size={20}
                  color="black"
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Search for a Health Facility"
                  placeholderTextColor="gray"
                  style={styles.input}
                  onChangeText={(value) => setSearchQuery(value)}
                  value={searchQuery}
                />
              </View>

              {/* Map Title */}
              <Text style={styles.mapTitle}>Nearest Health Facilities Map</Text>

              {/* Category List */}
              <CategoryList setSelectedCategory={setSelectedFacility} />

              {/* Google Map View */}
              <GoogleMapView
                locationList={locationList}
                selectedLocation={selectedLocation}
              />
            </UserLocationContext.Provider>
          </>
        }
        renderItem={({ item }) => (
          <LocationList
            locationList={[item]}
            onSelect={onSelectLocation}
            onModalClose={clearSearch}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.noLocationsText}>No locations found.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 0, // to align with the icon
    paddingRight: 10,
    color: "#424242",
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: "#6D31ED",
    height: 40,
    margin: 10,
  },
  searchIcon: {
    padding: 10,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    marginTop: 10,
    marginBottom: 5,
  },
  noLocationsText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
});

export default LocationScreen;
