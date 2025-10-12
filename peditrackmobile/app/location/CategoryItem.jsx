import { View, Text, StyleSheet} from 'react-native'
import React from 'react'

export default function CategoryItem({category, isSelected}) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.button,
          { backgroundColor: category.color },
          isSelected ? styles.selectedButton : null,
        ]}
        
      >
        <Text
          style={[
            styles.buttonText,
            isSelected ? styles.selectedButtonText : null,
          ]}
        >
          {category.name}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    elevation: 2,
  },
  selectedButton: {
    borderColor: '#6D31ED', // Highlight the selected button
    borderWidth: 2,
  },
  buttonText: {
    color: '#3D3D4D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedButtonText: {
    color: '#3D3D4D',
  },
})