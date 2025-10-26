import { View, FlatList, TouchableOpacity} from 'react-native'
import React,{ useState,useEffect} from 'react'
import CategoryItem from '../location/CategoryItem'

export default function CategoryList({setSelectedCategory}) {
   
    const categoryList = [
        {
            id: 1,
            name: 'Hospitals',
            value: 'hospital',
            color: '#F3F4F6'
            },
            {
            id: 2,
            name: 'Pharmacies',
            value: 'pharmacy',
            color: '#F3F4F6'
            },
            {
            id: 3,
            name: 'Dispensaries',
            value: 'doctor',
            color: '#F3F4F6'
            
            },
            {
            id: 4,
            name: 'Dental Clinics',
            value: 'dentist',
            color: '#F3F4F6'
            },
            {
            id: 5,
            name: 'Physical Therapy',
            value: 'physiotherapist',
            color: '#F3F4F6'
        }
    ]

  // Initialize selectedCategory with the value of the first category
  const [selectedCategoryValue, setSelectedCategoryValue] = useState(categoryList[0].value);

  useEffect(() => {
    // Set the initial selection for the parent component
    setSelectedCategory(selectedCategoryValue);
  }, []);

  // Function to handle category selection
  const handleSelectCategory = (category) => {
    setSelectedCategoryValue(category);// Update local state
    setSelectedCategory(category); // Update parent state
  };


  return (
    <View style={{marginTop:15}}>
      <FlatList
       data={categoryList}
       horizontal={true}
       keyExtractor={(item) => item.id.toString()} // Add key extractor
       nestedScrollEnabled={true}
       renderItem={({item}) => (
           <TouchableOpacity onPress={() => handleSelectCategory(item.value)}>
              <CategoryItem 
              category={item}
              isSelected={item.value === selectedCategoryValue} 
              />
           </TouchableOpacity>
       )}
      />
    </View>
  )
}