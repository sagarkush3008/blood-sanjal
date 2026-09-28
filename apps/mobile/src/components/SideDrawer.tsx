import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions, Pressable, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { fonts, colors } from '../theme';

const { width, height } = Dimensions.get('window');

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const [isLight, setIsLight] = React.useState(true);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleNavigate = (route: string) => {
    handleClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 200); // Wait for drawer to close before navigating
  };

  const userName = user?.name || 'David Chen';

  const menuItems = [
    { title: 'Home', icon: 'home', route: 'Home', active: true },
    { title: 'Find Blood Inventory', icon: 'search', route: 'FindBlood' },
    { title: 'Emergency Blood', icon: 'alert-circle', route: 'CreateEmergencyRequest' },
    { title: 'Request Blood', icon: 'water', route: 'CreateRequest' },
    { title: 'My Patient Account', icon: 'person-circle', route: 'Profile' },
    { title: 'Donate Blood Guide', icon: 'heart', route: 'DonationGuide' }, // fallback route or real route
    { title: 'Donor Dashboard', icon: 'hand-left', route: 'DonorDashboard' }, // fallback route
    { title: 'Blood Bank Directory', icon: 'add-box', route: 'Banks', iconType: 'material' },
    { title: 'Blood Bank Dashboard', icon: 'business', route: 'Banks' },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlayContainer}>
        {/* Backdrop for closing */}
        <Pressable 
          style={styles.backdrop} 
          onPress={handleClose} 
        />

        {/* Sliding Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerTop}
              activeOpacity={0.7}
              onPress={() => handleNavigate('Home')}
            >
              <View style={styles.logoCircle}>
                <Ionicons name="water" size={20} color="#DC2626" />
              </View>
              <Text style={styles.brandTitle}>Blood Sanjal</Text>
            </TouchableOpacity>
            <Text style={styles.headerSub}>National Blood Network</Text>
            
            <View style={styles.userRow}>
              <View style={styles.patientBadge}>
                <Text style={styles.patientBadgeText}>Patient: {userName}</Text>
              </View>
              <TouchableOpacity onPress={() => { handleClose(); logout(); }}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.menuItem, item.active && styles.menuItemActive]}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                {item.iconType === 'material' ? (
                  <Ionicons name="add-circle" size={22} color={item.active ? '#DC2626' : '#475569'} style={styles.menuIcon} />
                ) : (
                  <Ionicons name={item.icon as any} size={22} color={item.active ? '#DC2626' : '#475569'} style={styles.menuIcon} />
                )}
                <Text style={[styles.menuText, item.active && styles.menuTextActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer (Theme Toggle) */}
          <View style={styles.footer}>
            <View style={styles.themeToggleBox}>
              <View style={styles.themeInfo}>
                <Text style={styles.themeTitle}>Light Theme</Text>
                <Text style={styles.themeDesc}>Crisp high-contrast display</Text>
              </View>
              <View style={styles.switchContainer}>
                <Ionicons name="sunny" size={16} color="#D97706" style={{ position: 'absolute', left: 8, zIndex: 1 }} />
                <Switch 
                  value={isLight}
                  onValueChange={setIsLight}
                  trackColor={{ false: '#767577', true: '#FDE68A' }}
                  thumbColor={isLight ? '#FFFFFF' : '#f4f3f4'}
                  style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                />
              </View>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    backgroundColor: '#DC2626',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  headerSub: {
    fontSize: 13,
    color: '#FEE2E2',
    fontFamily: fonts.medium,
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  patientBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  scrollArea: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 24,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#FEF2F2',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: fonts.semiBold,
  },
  menuTextActive: {
    color: '#DC2626',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  themeToggleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: fonts.bold,
  },
  themeDesc: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  switchContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
});
