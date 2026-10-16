import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_HORIZONTAL_MARGIN = 14;
const INITIAL_BAR_WIDTH = SCREEN_WIDTH - BAR_HORIZONTAL_MARGIN * 2;
const BAR_HEIGHT = 68;

// Parabolic Curve Geometry on the Top Edge
const WAVE_HALF_WIDTH = 42; // Soft, wide span for a natural parabolic wave
const Y_BASE = 14;          // Top baseline height of the bar
const Y_PEAK = 2;           // Crest of the parabolic wave

// Symmetric cubic Bezier path for the parabolic wave over the active tab
// Starts horizontally at (-42, 14), smoothly rises to (0, 2), smoothly falls to (42, 14)
const PARABOLIC_STROKE_PATH = `M -${WAVE_HALF_WIDTH} ${Y_BASE} C -24 ${Y_BASE}, -18 ${Y_PEAK}, 0 ${Y_PEAK} C 18 ${Y_PEAK}, 24 ${Y_BASE}, ${WAVE_HALF_WIDTH} ${Y_BASE}`;
const PARABOLIC_AURA_PATH = `M -${WAVE_HALF_WIDTH} ${Y_BASE} C -24 ${Y_BASE}, -18 ${Y_PEAK}, 0 ${Y_PEAK} C 18 ${Y_PEAK}, 24 ${Y_BASE}, ${WAVE_HALF_WIDTH} ${Y_BASE} L ${WAVE_HALF_WIDTH} ${BAR_HEIGHT} L -${WAVE_HALF_WIDTH} ${BAR_HEIGHT} Z`;

interface TabConfig {
  name: string;
  label: string;
  type: 'ionicons' | 'feather';
  activeIcon: any;
  inactiveIcon: any;
}

// Exactly four evenly distributed tabs: Home, Find Blood, Donate, Requests
const TAB_CONFIGS: Record<string, TabConfig> = {
  Home: {
    name: 'Home',
    label: 'Home',
    type: 'ionicons',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  FindBlood: {
    name: 'FindBlood',
    label: 'Find Blood',
    type: 'feather',
    activeIcon: 'search',
    inactiveIcon: 'search',
  },
  Donate: {
    name: 'Donate',
    label: 'Donate',
    type: 'ionicons',
    activeIcon: 'water',
    inactiveIcon: 'water-outline',
  },
  Requests: {
    name: 'Requests',
    label: 'Requests',
    type: 'ionicons',
    activeIcon: 'clipboard',
    inactiveIcon: 'clipboard-outline',
  },
};

export const FloatingPillTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(INITIAL_BAR_WIDTH);
  const numTabs = state.routes.length;
  const tabWidth = barWidth / (numTabs || 1);

  // Shared value tracking active tab center X coordinate
  const animatedX = useSharedValue((state.index + 0.5) * tabWidth);

  useEffect(() => {
    if (barWidth > 0 && numTabs > 0) {
      const targetX = (state.index + 0.5) * tabWidth;
      animatedX.value = withSpring(targetX, {
        damping: 18,
        stiffness: 150,
        mass: 0.6,
      });
    }
  }, [state.index, barWidth, numTabs, tabWidth, animatedX]);

  // Translate the top parabolic wave directly on the GPU / UI thread
  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedX.value - WAVE_HALF_WIDTH }],
  }));

  // Top baseline line (left section) leading up to the wave's left flank
  const leftLineAnimatedStyle = useAnimatedStyle(() => {
    const w = Math.max(0, animatedX.value - WAVE_HALF_WIDTH - 16);
    return {
      width: w,
    };
  });

  // Top baseline line (right section) trailing from the wave's right flank
  const rightLineAnimatedStyle = useAnimatedStyle(() => {
    const leftPos = animatedX.value + WAVE_HALF_WIDTH;
    const w = Math.max(0, barWidth - leftPos - 16);
    return {
      left: leftPos,
      width: w,
    };
  });

  // Anchor strictly to the bottom of the screen with proper insets
  const bottomAnchor = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 10;

  return (
    <View
      style={[styles.floatingContainer, { bottom: bottomAnchor }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.capsuleBar, { width: barWidth }]}
        onLayout={(e) => {
          const newWidth = e.nativeEvent.layout.width;
          if (newWidth > 0 && Math.abs(newWidth - barWidth) > 1) {
            setBarWidth(newWidth);
          }
        }}
      >
        {/* Subtle Top Border Lines (Leading up to the wave) */}
        <Animated.View style={[styles.topLine, styles.topLineLeft, leftLineAnimatedStyle]} />
        <Animated.View style={[styles.topLine, rightLineAnimatedStyle]} />

        {/* SIGNATURE GLIDING PARABOLIC WAVE OVER ACTIVE TAB */}
        <Animated.View
          style={[styles.waveContainer, waveAnimatedStyle]}
          pointerEvents="none"
        >
          <Svg
            width={WAVE_HALF_WIDTH * 2}
            height={BAR_HEIGHT}
            viewBox={`-${WAVE_HALF_WIDTH} 0 ${WAVE_HALF_WIDTH * 2} ${BAR_HEIGHT}`}
          >
            <Defs>
              <LinearGradient id="redAura" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#E63946" stopOpacity="0.25" />
                <Stop offset="50%" stopColor="#E63946" stopOpacity="0.06" />
                <Stop offset="100%" stopColor="#E63946" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Soft Ambient Inner Glow Aura */}
            <Path d={PARABOLIC_AURA_PATH} fill="url(#redAura)" />

            {/* Diffuse Outer Neon Glow Stroke */}
            <Path
              d={PARABOLIC_STROKE_PATH}
              stroke="rgba(230, 57, 70, 0.35)"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />

            {/* Crisp Glowing Thin Red Core Stroke (#E63946) */}
            <Path
              d={PARABOLIC_STROKE_PATH}
              stroke="#E63946"
              strokeWidth={1.8}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        {/* FOUR EVENLY DISTRIBUTED TABS */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIGS[route.name] || {
              name: route.name,
              label: route.name,
              type: 'feather',
              activeIcon: 'circle',
              inactiveIcon: 'circle',
            };

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.tabButton, { width: tabWidth }]}
                onPress={onPress}
                activeOpacity={0.8}
              >
                {/* Tab Icon */}
                <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
                  {config.type === 'ionicons' ? (
                    <Ionicons
                      name={isFocused ? config.activeIcon : config.inactiveIcon}
                      size={22}
                      color={isFocused ? '#E63946' : '#94A3B8'}
                    />
                  ) : (
                    <Feather
                      name={isFocused ? config.activeIcon : config.inactiveIcon}
                      size={21}
                      color={isFocused ? '#E63946' : '#94A3B8'}
                    />
                  )}
                </View>

                {/* Signature Red Dot Indicator below Icon */}
                <View
                  style={[
                    styles.activeDot,
                    {
                      opacity: isFocused ? 1 : 0,
                      transform: [{ scale: isFocused ? 1 : 0.3 }],
                    },
                  ]}
                />

                {/* Tab Label */}
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  capsuleBar: {
    height: BAR_HEIGHT,
    borderRadius: 40, // Unified capsule shape with 40px radius
    backgroundColor: '#111115', // Deep dark obsidian background
    borderWidth: 1,
    borderColor: '#222228',
    overflow: 'hidden',
    position: 'relative',
    // Premium soft elevation shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 16,
  },
  topLine: {
    position: 'absolute',
    top: Y_BASE,
    height: 1.5,
    backgroundColor: 'rgba(230, 57, 70, 0.4)',
    borderRadius: 1,
  },
  topLineLeft: {
    left: 16,
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WAVE_HALF_WIDTH * 2,
    height: BAR_HEIGHT,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 15, // Comfortable padding below the top wave
  },
  iconWrapper: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    transform: [{ scale: 1.06 }],
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E63946',
    marginTop: 3,
    shadowColor: '#E63946',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#E63946',
    fontFamily: 'Inter_700Bold',
  },
  tabLabelInactive: {
    color: '#71717A',
    fontFamily: 'Inter_500Medium',
  },
});
