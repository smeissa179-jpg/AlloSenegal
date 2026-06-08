import { Stack } from 'expo-router';
import React from 'react';

export default function SuperviseurLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
