import React from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export type IconName = 'home' | 'health' | 'feeding' | 'location' | 'ai';

interface TabBarIconProps {
  name: IconName;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  focused,
  size = 24,
}) => {
  const color = focused ? Colors.primary.DEFAULT : Colors.inactive;

  const iconMap: Record<IconName, React.ReactNode> = {
    home: <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />,
    health: <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />,
    // "feeding" tab (MomHub) icon
    feeding: <Ionicons name={focused ? 'woman' : 'woman-outline'} size={size} color={color} />,
    // "Feeding" tab icon (meal)
    location: <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />,
    ai: <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />,
  };

  return iconMap[name];
};
