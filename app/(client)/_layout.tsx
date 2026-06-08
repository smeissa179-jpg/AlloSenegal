import React from 'react';
import { Stack } from 'expo-router';

export default function ClientLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#121214' },
      }}
    >
      <Stack.Screen name="home" />
    </Stack>
  );
}
