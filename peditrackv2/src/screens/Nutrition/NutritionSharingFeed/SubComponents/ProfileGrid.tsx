import React from 'react';
import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

interface ProfileGridProps {
  images: string[];
  onPostPress?: (index: number) => void;
}

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = 1;
const ITEM_SIZE = (width - (GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;

export const ProfileGrid: React.FC<ProfileGridProps> = ({ images, onPostPress }) => {
  return (
    <View style={styles.container}>
      {images.map((image, index) => (
        <TouchableOpacity 
          key={index} 
          onPress={() => onPostPress?.(index)}
          activeOpacity={0.8}
        >
          <Image 
            source={{ uri: image }} 
            style={styles.image} 
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    backgroundColor: '#fff',
  },
  image: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
});
