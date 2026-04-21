import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: Platform.OS !== 'web',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#2A2A2A',
          display: Platform.OS === 'web' ? 'none' : 'flex',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#9A9A9A',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Architect', headerTitle: 'Expo Architect' }} />
      <Tabs.Screen name="preview" options={{ title: 'Preview', headerTitle: 'Live Preview' }} />
      <Tabs.Screen name="code" options={{ title: 'Raw', headerTitle: 'Generated app.json' }} />
    </Tabs>
  );
}
