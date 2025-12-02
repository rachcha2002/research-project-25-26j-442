import { Tabs, useSegments } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { TabBarIcon } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const segments = useSegments();
  const hideUI = (segments as string[]).includes('feeding');

  return (
    <>
      {!hideUI && (
        <TopBar 
          username="Amanda"
          childName="Thisal"
          onProfilePress={() => console.log('Profile pressed')}
          onNotificationPress={() => console.log('Notification pressed')}
        />
      )}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary.DEFAULT,
          tabBarInactiveTintColor: Colors.inactive,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 85 : 70,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
            ...styles.tabBarShadow,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: 'Health',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="health" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="feeding"
          options={{
            title: 'Feeding',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="feeding" focused={focused} />
            ),
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="location"
          options={{
            title: 'Location',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="location" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="ai" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
});
