import { View, Text, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useContext } from 'react';
import { UserLocationContext } from '../../context/UserLocationContext';
import PlaceMarker from './PlaceMarker';

function GoogleMapView({locationList}) {
  const [mapRegion, setmapRegion] = useState(null);
  const {location} = useContext(UserLocationContext);

  useEffect(()=>{
    if(location){
      setmapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0522,
        longitudeDelta: 0.0421,
      })
    }
  },[location])

  if (!location || !mapRegion) {
    return (
      <View>
        <Text>Loading location...</Text>
      </View>
    );
  }

  console.log("Location: ", location);

  return (
    <View style={{
        marginTop:10,marginLeft:10,
        marginRight:10,marginBottom:10, 
        borderRadius:10, overflow:'hidden'
    }}>
      <MapView
      style={{
        width: Dimensions.get('screen').width*1.0, 
        height: Dimensions.get('screen').height*0.3,
    }}
    //provider={PROVIDER_GOOGLE}
    showsUserLocation={true}
      >
        <Marker title='You' coordinate={mapRegion}/>
        {locationList.map((item, index) => index<=10 &&(
          <PlaceMarker key={index} item={item} />
        ))}

         {locationList.map((place, index) => {
          if (place.geometry && place.geometry.location) {
            const { lat, lng } = place.geometry.location;

            return (
              <Marker
                key={place.place_id || index}
                coordinate={{ latitude: lat, longitude: lng }}
                title={place.name}
                description={place.vicinity}
              />
            );
          }
          return null;
        })}
      </MapView>
    </View>
  )
}
export default GoogleMapView;