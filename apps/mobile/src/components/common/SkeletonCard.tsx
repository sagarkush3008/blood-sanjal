import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonCardProps {
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 100,
  borderRadius = 14,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { height, borderRadius, opacity: opacityAnim },
        style,
      ]}
    >
      <View style={styles.shimmerLine} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginVertical: 6,
    overflow: 'hidden',
  },
  shimmerLine: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
