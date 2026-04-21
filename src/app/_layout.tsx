import { Stack } from 'expo-router';
import React from 'react';

import { ArchitectProvider } from '@/state/architect-store';

export default function RootLayout() {
  return (
    <ArchitectProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ArchitectProvider>
  );
}
