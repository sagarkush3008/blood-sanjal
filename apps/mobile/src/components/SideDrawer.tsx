import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { fonts } from '../theme';

const { width } = Dimensions.get('window');

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  active?: boolean;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleNavigate = (route: string) => {
    handleClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 180);
  };

  const menuItems: MenuItem[] = [
    { title: 'Home', icon: 'home', route: 'Home', active: true },
    { title: 'Find Blood Inventory', icon: 'search', route: 'FindBlood' },
    { title: 'Emergency Blood', icon: 'alert-circle', route: 'CreateEmergencyRequest' },
    { title: 'Request Blood', icon: 'droplet', route: 'CreateRequest' },
    { title: 'My Patient Account', icon: 'user', route: 'Profile' },
    { title: 'Donate Blood Guide', icon: 'heart', route: 'DonationGuide' },
    { title: 'Donor Dashboard', icon: 'activity', route: 'DonorDashboard' },
    { title: 'Blood Bank Directory', icon: 'map-pin', route: 'Banks' },
    { title: 'Settings', icon: 'settings', route: 'Settings' },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlayContainer}>
        {/* Soft backdrop */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* Sliding Drawer Container */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* 1. HEADER SECTION */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBrand}
              activeOpacity={0.8}
              onPress={() => handleNavigate('Home')}
            >
              <View style={styles.logoBox}>
                <Image 
                  source={require('../../assets/logo.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain" 
                />
              </View>
              <View style={styles.brandTextCol}>
                <Text style={styles.brandTitle}>Blood Sanjal</Text>
                <Text style={styles.brandTagline}>Nepal Blood Network</Text>
              </View>
            </TouchableOpacity>

            {user?.name && (
              <View style={styles.welcomeBox}>
                <Text style={styles.welcomeLabel}>Signed in as</Text>
                <Text style={styles.welcomeName} numberOfLines={1}>{user.name}</Text>
              </View>
            )}
          </View>

          {/* 2. MENU ITEMS (LIST DESIGN) */}
          <ScrollView 
            style={styles.scrollArea} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {menuItems.map((item, index) => {
              const isActive = !!item.active;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <Feather 
                    name={item.icon} 
                    size={20} 
                    color={isActive ? '#DC2626' : '#64748B'} 
                    style={styles.menuIcon} 
                  />
                  <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 3. FOOTER AREA (LOGOUT & APP VERSION) */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                handleClose();
                logout();
              }}
              activeOpacity={0.75}
            >
              <Feather name="log-out" size={18} color="#DC2626" style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Blood Sanjal • v1.0.0 (Build 42)</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Math.min(width * 0.78, 320),
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 22,
    paddingBottom: 24,
    marginBottom: 8,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#64748B',
    marginTop: 1,
  },
  welcomeBox: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  welcomeLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeName: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: '#0F172A',
    marginTop: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#FEF2F2',
  },
  menuIcon: {
    marginRight: 14,
  },
  menuText: {
    fontSize: 14.5,
    color: '#1E1E1E',
    fontFamily: fonts.semiBold,
    letterSpacing: -0.2,
  },
  menuTextActive: {
    color: '#DC2626',
    fontFamily: fonts.bold,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 14,
    color: '#1E1E1E',
    fontFamily: fonts.semiBold,
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.medium,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
});
