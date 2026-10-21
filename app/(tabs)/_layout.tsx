import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { AppIcon } from '@/components/icon';
import { colors } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slateMuted,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="dashboard" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="inventory_2" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="point_of_sale" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, focused }) => (
            <View className="relative">
              <AppIcon name="group" size={22} color={color} />
              {/* Badge for overdue debt count */}
              <View className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-error" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name="more_horiz" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
