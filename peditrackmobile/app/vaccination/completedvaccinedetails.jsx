import { View, Text, Image, StyleSheet } from 'react-native'
import React from 'react'
import SubScreenHeader from "../../components/SubScreenHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';

const completedvaccinedetails = () => {
    const route = useRoute();
  const { vaccine } = route.params;
  return (
    <SafeAreaView className="bg-white h-full">
      <SubScreenHeader title="Completed Vaccines" goBackPath={"vaccination/completedvaccinelist"} />
      <View>
      <Text style={styles.header}>{vaccine.name}</Text>
      </View>
      <View style={styles.card}>
      <Image
        source={vaccine.image}
        style={styles.image}
      />
       <View >
      <Text style={styles.desc}>{vaccine.description}</Text>
      </View>
      <View style={styles.detailsContainer}>
          <Text style={styles.label}>Vaccinated Date: <Text style={styles.value}>{vaccine.dueDate}</Text></Text>
          <Text style={styles.label}>Vaccinated Time: <Text style={styles.value}>{vaccine.Time}</Text></Text>
          <Text style={styles.label}>Batch No: <Text style={styles.value}>{vaccine.batchNo}</Text></Text>
      </View>
      
      <View style={styles.notesContainer}>
        <Text style={styles.label}>Special notes</Text>
        <Text style={styles.value}>{vaccine.specialDetails}</Text>
      </View>
    </View>
    </SafeAreaView>
  )
}

export default completedvaccinedetails


const styles = StyleSheet.create({
    card: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      elevation: 5,
      margin: 10,
      alignItems: 'center',
    },
    header: {
      marginTop:30,
      textAlign:"center",
      fontSize: 22,
      fontWeight: 'bold',
      color: '#7360F2',
      paddingHorizontal:20,
      marginBottom: 10,
    },
    image: {
      width: 200,
      height: 250,
      resizeMode: 'contain',
      marginBottom: 20,
    },
    detailsContainer: {
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    desc: {
      textAlign:"center",
      fontSize: 18,
      color: '#555',
      marginTop:10,
      marginBottom:20
    },
    label: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 5,
    },
    value: {
        marginLeft:10,
      fontSize: 20,
      color: '#555',
    },
    notesContainer: {
      alignItems: 'flex-start',
    },
  });