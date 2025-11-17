import { View, Text, ScrollView } from 'react-native';

export default function FeedingScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold">Feeding Screen</Text>
      </View>
    </ScrollView>
  );
}
