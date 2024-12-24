import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export const LoadingSpinner = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#2196F3" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
}); 