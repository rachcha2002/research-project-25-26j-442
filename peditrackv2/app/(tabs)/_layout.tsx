import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  const color = focused ? '#8B7FE8' : '#9CA3AF';
  
  return (
    <View style={styles.tabIcon}>
      <Text style={{ color, fontSize: 24 }}>{icon}</Text>
      <Text style={[styles.tabLabel, { color }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 70,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💜" label="Health" />
          ),
        }}
      />
      <Tabs.Screen
        name="vaccine"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💉" label="Vaccine" />
          ),
        }}
      />
      <Tabs.Screen
        name="feeding"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🍼" label="Feeding" />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📍" label="Location" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
});
