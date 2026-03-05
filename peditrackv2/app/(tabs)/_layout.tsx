import { Tabs, useSegments, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/BottomNav';
import { TopBar } from '@/components/TopBar';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBaby } from '../../src/contexts/BabyContext';

export default function TabLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { user } = useAuth();
  const { selectedBaby } = useBaby();
  const hideUI = (segments as string[]).includes('feeding');
  const insets = useSafeAreaInsets();

  return (
    <>
      {!hideUI && (
        <TopBar
          username={user?.name}
          childName={selectedBaby?.name}
          profileImage={user?.profilePicture}
          onProfilePress={() => router.push('/profile')}
          onChildNamePress={() => router.push('/profile/baby-profiles')}
        />
      )}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary.DEFAULT,
          tabBarInactiveTintColor: Colors.inactive,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 0,
            height: 60 + Math.max(insets.bottom, 10),
            paddingBottom: Math.max(insets.bottom, 10),
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
            title: 'MomHub',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name="feeding" focused={focused} />
            ),
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
          name="location"
          options={{
            title: 'Feeding',
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
