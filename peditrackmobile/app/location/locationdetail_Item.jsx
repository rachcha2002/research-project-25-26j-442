import { View, Text, Image } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Locationdetail_Item({place}) {
  const photoReference = place.photos?.[0]?.photo_reference; // Use optional chaining
  const name = place.name || "Unnamed Location";
  const vicinity = place.vicinity || "Unnamed Location";
  const rating = place.rating ? place.rating.toString() : "N/A"; // Default to "N/A" if rating is not available
  const opening_hours = place.opening_hours?.open_now;
  
  return (
    <View>
      <Text style={{fontSize:26,fontWeight:'bold'}}>
        {place.name}
      </Text>
      <View 
      style={{
        display:'flex',
        alignItems:'center',
        gap:5,
        flexDirection:'row',
        marginTop:10}}
       > 

         {photoReference ? (
  <Image
    source={{
      uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=AIzaSyDYPmtB26Wq6bdiMMeNonoAUgoJ9go0nX4`
    }}
    style={{ width: 110, height: 110, borderRadius: 15 }}
  />
) : (
  <Image
    source={require('../../assets/images/build/peditrackmini.png')}  // Path to your default image
    style={{ width: 110, height: 110, borderRadius: 15 }}
  />
)}
 <View style={{flex:1}}>
      <Text numberOfLines={2}
      style={{fontSize:18,fontWeight:'bold',marginBottom:5}}>
        {name}
      </Text>
      <Text numberOfLines={2}
      style={{fontSize:18, marginBottom:5}}>
        {vicinity}
      </Text>
      <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
  {rating ? (
    <>
      <AntDesign name="star" size={20} color="gold" />
      <Text style={{fontSize: 18}}>{rating}</Text>
    </>
  ) : (
    <Text style={{fontSize: 18}}>No Ratings</Text>
  )}
</View>
</View>
      </View>
      {opening_hours ? (
        <Text style={{fontSize:18,fontWeight:'bold'}}>
          {place?.opening_hours?.open_now == true ? "(Open)" : "(Closed)"}
        </Text>
      ):null}
    </View>
  )
}