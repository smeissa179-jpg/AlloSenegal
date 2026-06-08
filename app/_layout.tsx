import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
  const { user, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';

    if (!user) {
      // Redirect to login if not authenticated and not already in auth group
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (user && role) {
      // Redirect authenticated users to their respective workspace
      const inClientGroup = segs[0] === '(client)';
      const inChauffeurGroup = segs[0] === '(chauffeur)';
      const inCoacheurGroup = segs[0] === '(coacheur)';
      const inSuperviseurGroup = segs[0] === '(superviseur)';

      // If user is in the auth screen or root, redirect to their home
      const needsRedirect = inAuthGroup || segs.length === 0 || segs[0] === 'index';

      if (needsRedirect) {
        if (role === 'client') {
          router.replace('/(client)/home');
        } else if (role === 'chauffeur') {
          router.replace('/(chauffeur)/dashboard');
        } else if (role === 'coacheur') {
          router.replace('/(coacheur)/dashboard');
        } else if (role === 'superviseur') {
          router.replace('/(superviseur)/dashboard');
        }
      }
    }
  }, [user, role, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121214', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121214' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(client)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(chauffeur)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(coacheur)" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
