import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export const WaveformAnimation = () => {
  const bars = Array.from({ length: 5 }).map(() => ({
    animation: useRef(new Animated.Value(0)).current
  }));

  useEffect(() => {
    const animations = bars.map((bar, index) => 
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(bar.animation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bar.animation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ])
      )
    );

    Animated.parallel(animations).start();
    return () => animations.forEach(anim => anim.stop());
  }, []);

  return (
    <View style={styles.container}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              transform: [{
                scaleY: bar.animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1]
                })
              }]
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
    gap: 8,
    backgroundColor: '#F7F8FA',
  },
  bar: {
    width: 6,
    height: 40,
    backgroundColor: '#666',
    borderRadius: 3,
  },
}); 