import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  Modal,
  Vibration,
  Linking,
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
const BAR_HORIZONTAL_MARGIN = 12;
const INITIAL_BAR_WIDTH = SCREEN_WIDTH - BAR_HORIZONTAL_MARGIN * 2;
const BAR_HEIGHT = 68;

// Circular Logo Button Dimensions on the Left
const LOGO_BTN_SIZE = 44;
const LOGO_BTN_LEFT = 8;
const LOGO_BTN_RIGHT = 6;
const TABS_START_OFFSET = LOGO_BTN_LEFT + LOGO_BTN_SIZE + LOGO_BTN_RIGHT; // ~58px

// Signature Wave Curve Parameters
const WAVE_HALF_WIDTH = 26; // Half-width of the arch in px
const Y_BASE = 59;          // Bottom horizontal baseline (runs cleanly underneath labels)
const Y_PEAK = 7;           // Crest of the arch (smoothly caps over the active tab icon)

// Mathematical Cubic Bezier Wave with continuous horizontal tangents:
// Baseline left (-800 to -26) -> Smooth rise to peak (0, 7) -> Smooth descent to baseline (26, 59) -> Baseline right (26 to 800)
const SIGNATURE_WAVE_PATH = `M -800 ${Y_BASE} L -${WAVE_HALF_WIDTH} ${Y_BASE} C -16 ${Y_BASE}, -10 ${Y_PEAK}, 0 ${Y_PEAK} C 10 ${Y_PEAK}, 16 ${Y_BASE}, ${WAVE_HALF_WIDTH} ${Y_BASE} L 800 ${Y_BASE}`;
const WAVE_AURA_PATH = `M -${WAVE_HALF_WIDTH} ${Y_BASE} C -16 ${Y_BASE}, -10 ${Y_PEAK}, 0 ${Y_PEAK} C 10 ${Y_PEAK}, 16 ${Y_BASE}, ${WAVE_HALF_WIDTH} ${Y_BASE} L ${WAVE_HALF_WIDTH} ${BAR_HEIGHT} L -${WAVE_HALF_WIDTH} ${BAR_HEIGHT} Z`;

interface TabConfig {
  name: string;
  label: string;
  type: 'ionicons' | 'feather';
  activeIcon: any;
  inactiveIcon: any;
  hasBadge?: boolean;
}

// Exactly matching Blood Sanjal app tabs aligned with the user reference design:
// [ Circular Logo Button ] | Home | Search | Donate | Requests (with red badge) | Profile
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
    label: 'Search',
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
    activeIcon: 'chatbubble-ellipses',
    inactiveIcon: 'chatbubble-ellipses-outline',
    hasBadge: true, // Red unread badge dot matching "Inbox" in reference image
  },
  Profile: {
    name: 'Profile',
    label: 'Profile',
    type: 'feather',
    activeIcon: 'user',
    inactiveIcon: 'user',
  },
};

export const FloatingPillTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(INITIAL_BAR_WIDTH);
  const [sosModalVisible, setSosModalVisible] = useState(false);

  // Tab layout metrics
  const numTabs = state.routes.length || 5;
  const availableTabsWidth = Math.max(100, barWidth - TABS_START_OFFSET - 8);
  const tabWidth = availableTabsWidth / numTabs;

  // Active tab center X coordinate relative to the bar
  const activeCenterX = TABS_START_OFFSET + (state.index + 0.5) * tabWidth;
  const animatedX = useSharedValue(activeCenterX);

  useEffect(() => {
    const targetX = TABS_START_OFFSET + (state.index + 0.5) * tabWidth;
    animatedX.value = withSpring(targetX, {
      damping: 18,
      stiffness: 150,
      mass: 0.6,
    });
  }, [state.index, barWidth, numTabs, tabWidth, activeCenterX, animatedX]);

  // Translate the wave component directly on the GPU UI thread
  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animatedX.value }],
  }));

  // Handle circular logo button press (SOS / Emergency Quick Action)
  const handleLogoPress = () => {
    try {
      Vibration.vibrate(25);
    } catch {}
    setSosModalVisible(true);
  };

  const bottomAnchor = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12;

  return (
    <>
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
          {/* 1. SIGNATURE GLIDING RED WAVE WITH DUAL NEON GLOW */}
          <Animated.View
            style={[styles.waveContainer, waveAnimatedStyle]}
            pointerEvents="none"
          >
            <Svg width={1600} height={BAR_HEIGHT} viewBox={`-800 0 1600 ${BAR_HEIGHT}`}>
              <Defs>
                <LinearGradient id="redWaveAura" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FF2A42" stopOpacity="0.22" />
                  <Stop offset="60%" stopColor="#FF2A42" stopOpacity="0.04" />
                  <Stop offset="100%" stopColor="#FF2A42" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Soft Ambient Inner Glow Aura inside the arch */}
              <Path d={WAVE_AURA_PATH} fill="url(#redWaveAura)" />

              {/* Diffuse Outer Neon Glow Stroke */}
              <Path
                d={SIGNATURE_WAVE_PATH}
                stroke="rgba(255, 42, 66, 0.32)"
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />

              {/* Crisp Core Stroke (#FF2A42) */}
              <Path
                d={SIGNATURE_WAVE_PATH}
                stroke="#FF2A42"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* 2. THE APP'S CIRCULAR EMBOSSED LOGO BUTTON (Far Left) */}
          <TouchableOpacity
            style={styles.logoCircleButton}
            onPress={handleLogoPress}
            activeOpacity={0.8}
            accessibilityLabel="Blood Sanjal Emergency Quick Actions"
          >
            <View style={styles.logoCircleInner}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {/* 3. APP TABS ROW: Home, Search, Donate, Requests, Profile */}
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
                  try {
                    Vibration.vibrate(10);
                  } catch {}
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  style={[styles.tabButton, { width: tabWidth }]}
                  onPress={onPress}
                  activeOpacity={0.75}
                >
                  {/* Tab Icon */}
                  <View style={styles.iconContainer}>
                    {config.type === 'ionicons' ? (
                      <Ionicons
                        name={isFocused ? config.activeIcon : config.inactiveIcon}
                        size={21}
                        color={isFocused ? '#FF2A42' : '#8E8E93'}
                      />
                    ) : (
                      <Feather
                        name={isFocused ? config.activeIcon : config.inactiveIcon}
                        size={20}
                        color={isFocused ? '#FF2A42' : '#8E8E93'}
                      />
                    )}

                    {/* Unread badge dot on Requests (matching Inbox badge in reference) */}
                    {config.hasBadge && (
                      <View
                        style={[
                          styles.badgeDot,
                          isFocused && { borderColor: '#161619' },
                        ]}
                      />
                    )}
                  </View>

                  {/* Active Indicator Dot below Icon */}
                  <View
                    style={[
                      styles.activeDot,
                      {
                        opacity: isFocused ? 1 : 0,
                        backgroundColor: isFocused ? '#FF2A42' : 'transparent',
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

      {/* EMERGENCY SOS / QUICK ACTION MODAL FOR THE CIRCULAR LOGO BUTTON */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSosModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalLogoBadge}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.modalLogoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.modalTitle}>Blood Sanjal Quick Actions</Text>
              <Text style={styles.modalSubtitle}>
                Lifesaving assistance at your fingertips
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              activeOpacity={0.85}
              onPress={() => {
                setSosModalVisible(false);
                navigation.navigate('Requests');
              }}
            >
              <Ionicons name="alert-circle" size={22} color="#FFFFFF" />
              <View style={styles.actionBtnTextCol}>
                <Text style={styles.actionBtnPrimaryTitle}>Post Urgent Blood Request</Text>
                <Text style={styles.actionBtnPrimarySubtitle}>Notify verified donors in seconds</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              activeOpacity={0.8}
              onPress={() => {
                setSosModalVisible(false);
                navigation.navigate('FindBlood');
              }}
            >
              <Feather name="search" size={20} color="#FF2A42" />
              <Text style={styles.actionBtnSecondaryText}>Find Donors Nearby</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              activeOpacity={0.8}
              onPress={() => {
                setSosModalVisible(false);
                Linking.openURL('tel:102');
              }}
            >
              <Ionicons name="call" size={20} color="#10B981" />
              <Text style={styles.actionBtnSecondaryText}>Emergency Ambulance / Red Cross (102)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSosModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
    borderRadius: BAR_HEIGHT / 2, // Perfect pill capsule (34px)
    backgroundColor: '#161619',   // Deep matte obsidian
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    // Realistic elevated floating drop shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 16,
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: BAR_HEIGHT,
  },
  // Circular Neumorphic Button on the Left
  logoCircleButton: {
    width: LOGO_BTN_SIZE,
    height: LOGO_BTN_SIZE,
    borderRadius: LOGO_BTN_SIZE / 2,
    marginLeft: LOGO_BTN_LEFT,
    marginRight: LOGO_BTN_RIGHT,
    backgroundColor: '#202025',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 7,
    zIndex: 10,
  },
  logoCircleInner: {
    width: LOGO_BTN_SIZE - 6,
    height: LOGO_BTN_SIZE - 6,
    borderRadius: (LOGO_BTN_SIZE - 6) / 2,
    backgroundColor: '#18181D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  // Tabs Container
  tabsRow: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    zIndex: 10,
  },
  tabButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  iconContainer: {
    width: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF2A42',
    borderWidth: 1.5,
    borderColor: '#161619',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    shadowColor: '#FF2A42',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 9.5,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
  tabLabelInactive: {
    color: '#8E8E93',
    fontFamily: 'Inter_500Medium',
  },
  // SOS Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#18181D',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalLogoBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#24242B',
    borderWidth: 2,
    borderColor: '#FF2A42',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalLogoImage: {
    width: 36,
    height: 36,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  actionBtnPrimary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionBtnTextCol: {
    flex: 1,
  },
  actionBtnPrimaryTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  actionBtnPrimarySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  actionBtnSecondary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24242B',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#F1F5F9',
  },
  modalCloseBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#94A3B8',
  },
});
