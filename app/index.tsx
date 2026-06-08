import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexPage() {
  return (
    <View style={{ flex: 1, backgroundColor: '#121214', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0ea5e9" />
    </View>
  );
}
