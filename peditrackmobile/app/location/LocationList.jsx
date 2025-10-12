import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Button,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Linking
} from 'react-native';
import { AntDesign } from '@expo/vector-icons'; // For star icon
import LocationItem from '../location/LocationItem';
import axios from 'axios'; // For making API requests

export default function LocationList({ locationList , onSelect , onModalClose }) {

  const [selectedLocation, setSelectedLocation] = useState(null); // Selected location data
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility
  const [loading, setLoading] = useState(false); // Loading state for Place Details
  const [phoneNumber, setPhoneNumber] = useState(null); // Contact number

  // Replace with your Google Places API Key
  const GOOGLE_API_KEY = 'AIzaSyDYPmtB26Wq6bdiMMeNonoAUgoJ9go0nX4';

  // If locationList is not an array, handle it
  if (!Array.isArray(locationList) || locationList.length === 0) {
    return <Text>No locations found.</Text>;
  }

  const openModal = async (location) => {
    setLoading(true);
    setModalVisible(true);
     // Extract photoReference if available
     const photoReference =
     location.photos && location.photos.length > 0
       ? location.photos[0].photo_reference
       : null;
   setSelectedLocation({ ...location, photoReference }); // Add photoReference to selected location

    // Check if location already has phone_number
    if (location.phone_number) {
      setPhoneNumber(location.phone_number);
      setLoading(false);
      return;
    }

    try {
      // Fetch Place Details
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: location.place_id,
            fields: 'formatted_phone_number', // Specify fields you need
            key: GOOGLE_API_KEY,
          },
        }
      );

      if (
        response.data.status === 'OK' &&
        response.data.result &&
        response.data.result.formatted_phone_number
      ) {
        setPhoneNumber(response.data.result.formatted_phone_number);
        // Optionally, update the locationList with the phone number
        // to prevent re-fetching in the future
      } else {
        setPhoneNumber('N/A');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setPhoneNumber('N/A');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedLocation(null);
    setPhoneNumber(null);
    onSelect(null);
    // Call the parent's function to clear the search bar
    onModalClose();
  };

  const handleCallPress = () => {
    if (phoneNumber && phoneNumber !== 'N/A') {
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch((err) =>
        console.error('Failed to open dialer:', err)
      );
    }
  };

  return (
    <View style={{ marginLeft: 10 }}>
      <Text>Found {locationList.length} Facilities</Text>
      <FlatList
        data={locationList.filter((item) => item)}
        keyExtractor={(item) =>
          item.place_id || item.id || Math.random().toString()
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openModal(item)}>
            <LocationItem place={item} />
          </TouchableOpacity>
        )}
      />

      {/* Modal to display details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            {/* Close button */}
      <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
        <AntDesign name="close" size={24} color="black" />
      </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.modalTitle}>Location Details</Text>

              {loading && <ActivityIndicator size="large" color="#0000ff" />}

              {selectedLocation && !loading && (
                <View style={styles.detailsContainer}>
                  {/* Icon */}
                  {selectedLocation.icon && (
                    <Image
                      source={{ uri: selectedLocation.icon }}
                      style={styles.iconImage}
                      accessible={true}
                      accessibilityLabel="Location Icon"
                    />
                  )}

                  {/* Image with fallback */}
                  {selectedLocation.photoReference ? (
                    <Image
                      source={{
                        uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${selectedLocation.photoReference}&key=${GOOGLE_API_KEY}`
                      }}
                      style={styles.locationImage}
                      onError={(e) => {
                        console.log('Error loading image:', e.nativeEvent.error);
                      }}
                      accessible={true}
                      accessibilityLabel="Location Image"
                    />
                  ) : (
                    <Image
                      source={require('../../assets/images/build/peditrackmini.png')} // Default image
                      style={styles.locationImage}
                      accessible={true}
                      accessibilityLabel="Default Image"
                    />
                  )}

                  {/* Location Name */}
                  <Text numberOfLines={2} style={styles.locationName}>
                    {selectedLocation.name}
                  </Text>

                  {/* Business Status */}
                  <Text style={styles.detailText}>
                    Status:{' '}
                    {selectedLocation.business_status
                      ? selectedLocation.business_status
                      : 'N/A'}
                  </Text>

                  {/* Location Vicinity */}
                  <Text numberOfLines={2} style={styles.detailText}>
                    Address: {selectedLocation.vicinity}
                  </Text>


                  {/* Plus Code */}
                  {selectedLocation.plus_code && (
                    <Text style={styles.detailText}>
                      Plus Code: {selectedLocation.plus_code.compound_code}
                    </Text>
                  )}

                  {/* Opening Hours */}
                  {selectedLocation.opening_hours && (
                    <Text style={styles.detailText}>
                      {selectedLocation.opening_hours.open_now
                        ? 'Currently Open'
                        : 'Currently Closed'}
                    </Text>
                  )}

                  {/* Rating */}
                  <View style={styles.ratingContainer}>
                    {selectedLocation.rating ? (
                      <>
                        <AntDesign name="star" size={20} color="gold" />
                        <Text style={styles.ratingText}>
                          {selectedLocation.rating} (
                          {selectedLocation.user_ratings_total} ratings)
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.ratingText}>No Ratings</Text>
                    )}
                  </View>

                  {/* Types */}
                  {selectedLocation.types && (
                    <View style={styles.typesContainer}>
                      <Text style={styles.typesTitle}>Categories:</Text>
                      <View style={styles.typesList}>
                        {selectedLocation.types.map((type, index) => (
                          <Text key={index} style={styles.typeItem}>
                            {type}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}


                  {/* Contact Number */}
                  <Text style={styles.detailText}>
                    Contact: {phoneNumber || 'Loading...'}
                  </Text>

                  {/* Call Button */}
                  {phoneNumber && phoneNumber !== 'N/A' && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={handleCallPress}
                    >
                      <AntDesign name="phone" size={20} color="white" />
                      <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  iconImage: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  ratingText: {
    fontSize: 16,
    marginLeft: 5,
  },
  typesContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  typesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  typesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    margin: 3,
    fontSize: 14,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D31ED',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1, // Ensures the button stays above the modal content
  },
});
