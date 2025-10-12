import { View, Text, Image } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { icons } from "../../constants";

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center">
      <Image
        source={icon}
        resizeMode="contain"
        style={{ tintColor: color }}
        className="w-6 h-6"
      />
      <Text
        className={`${focused ? "font-semibold" : "font-regular"} text-xs`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64, // Increase the height of the tab bar
          paddingBottom: 5, // Adjust padding as needed
          paddingTop: 5, // Adjust padding as needed
          backgroundColor: "#ffffff", // White background for the tab bar
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0", // Light gray border color
        },
        tabBarActiveTintColor: "#7360F2", // Green color for active tab icons and text
        tabBarInactiveTintColor: "#666666", // Black color for inactive tab icons and text
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              color={color}
              name="Home"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.health}
              color={color}
              name="Health"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="vaccine"
        options={{
          title: "Vaccine",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.vaccine}
              color={color}
              name="Vaccine"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="feeding"
        options={{
          title: "Feeding",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.feeding}
              color={color}
              name="Feeding"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: "Location",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.location}
              color={color}
              name="Location"
              focused={focused}
            />
          ),
        }}
      />

      
    </Tabs>
  );
};

export default TabsLayout;
