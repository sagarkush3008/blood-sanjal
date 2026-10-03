import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BloodRequestsAPI } from '../../api/requests.api';
import { useAuthStore } from '../../store/authStore';
import { SideDrawer } from '../../components/SideDrawer';
import { colors, fonts } from '../../theme';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface CleanInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const CleanInput: React.FC<CleanInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
};

export const CreateRequestScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  // App Bar state
  const [isDark, setIsDark] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Form state
  const initialUrgency = route.params?.urgency === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL';
  const initialGroup = route.params?.bloodGroup || 'O+';

  const [urgency, setUrgency] = useState<'NORMAL' | 'EMERGENCY'>(initialUrgency);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>(initialGroup);
  const [units, setUnits] = useState<number>(2);

  // Hospital & Timing
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [urgencyWindow, setUrgencyWindow] = useState('Immediate / As soon as possible');

  // Contact & Reason
  const [attendantName, setAttendantName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [reason, setReason] = useState('Surgical procedure / blood replacement');
  const [clinicalInstructions, setClinicalInstructions] = useState('');

  // Platform Maintenance Fee
  const [walletProvider, setWalletProvider] = useState<'eSewa' | 'Khalti'>('eSewa');
  const [transactionRef, setTransactionRef] = useState('');
  const platformFee = 15;

  const createMutation = useMutation({
    mutationFn: (payload: any) => BloodRequestsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
      Alert.alert(
        'Blood Request Submitted! 🩸',
        urgency === 'EMERGENCY'
          ? 'Your emergency request has been prioritized with URGENT badge and sent for verified donor broadcast dispatch.'
          : 'Your blood request has been published and matched with verified donors in your hospital vicinity.',
        [
          {
            text: 'View Requests',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to submit blood request. Please verify required fields.';
      Alert.alert('Validation Error', msg);
    },
  });

  const handleSubmit = () => {
    if (!patientName.trim()) {
      Alert.alert('Required Field', 'Please enter Patient Full Name.');
      return;
    }
    if (!hospitalName.trim()) {
      Alert.alert('Required Field', 'Please enter Hospital Name.');
      return;
    }
    if (!contactPhone.trim()) {
      Alert.alert('Required Field', 'Please enter a valid Contact Phone Number.');
      return;
    }

    const payload = {
      patientName: patientName.trim(),
      bloodGroup,
      unitsRequired: units,
      hospitalName: hospitalName.trim(),
      hospitalLocation: {
        address: hospitalAddress.trim() || hospitalName.trim(),
        wardRoom: hospitalAddress.trim(),
        cityName: city.trim(),
      },
      city: city.trim(),
      requiredDate,
      urgency,
      urgencyWindow,
      contactPerson: {
        name: attendantName.trim() || patientName.trim(),
        phone: contactPhone.trim(),
      },
      contactPhone: contactPhone.trim(),
      reason: reason.trim(),
      additionalInfo: clinicalInstructions.trim(),
      paymentReference: transactionRef.trim() || undefined,
      paymentProvider: walletProvider,
      platformFeeNpr: platformFee,
    };

    createMutation.mutate(payload);
  };

  const userName = user?.name || 'David Chen';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER: BloodLink App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => setDrawerVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={22} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.brandRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="water" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brandText}>Blood Sanjal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.themeToggle}
          onPress={() => setIsDark(!isDark)}
          activeOpacity={0.8}
        >
          <View style={[styles.themeThumb, isDark && styles.themeThumbDark]}>
            <Text style={{ fontSize: 11 }}>{isDark ? '🌙' : '☀️'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.userBadge}>
          <Ionicons name="person-circle" size={17} color="#DC2626" />
          <Text style={styles.userBadgeText} numberOfLines={1}>
            {userName}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications" size={20} color="#0F172A" />
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>2</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* CARD 1: Header Card */}
        <View style={styles.card}>
          <Text style={styles.mainTitle}>Submit Blood Request</Text>
          <Text style={styles.mainSubtitle}>
            Request blood units from certified banks & matched eligible donors. Every request is verified.
          </Text>
        </View>

        {/* CARD 2: Urgency Type */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Urgency Type (Normal or Emergency) *</Text>
          <View style={styles.urgencyRow}>
            {/* Normal Request Option */}
            <TouchableOpacity
              style={[
                styles.urgencyOption,
                urgency === 'NORMAL' && styles.urgencyOptionNormalSelected,
              ]}
              onPress={() => setUrgency('NORMAL')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.urgencyTitle,
                  urgency === 'NORMAL' && styles.urgencyTitleNormalSelected,
                ]}
              >
                Normal Request
              </Text>
              <Text
                style={[
                  styles.urgencySub,
                  urgency === 'NORMAL' && styles.urgencySubNormalSelected,
                ]}
              >
                Scheduled surgery / general care. Displayed in Public Requests.
              </Text>
            </TouchableOpacity>

            {/* Emergency Blood Option */}
            <TouchableOpacity
              style={[
                styles.urgencyOption,
                urgency === 'EMERGENCY'
                  ? styles.urgencyOptionEmergencySelected
                  : styles.urgencyOptionEmergencyUnselected,
              ]}
              onPress={() => setUrgency('EMERGENCY')}
              activeOpacity={0.85}
            >
              <View style={styles.emergencyTitleRow}>
                <Ionicons
                  name="warning"
                  size={14}
                  color={urgency === 'EMERGENCY' ? '#FFFFFF' : '#DC2626'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.urgencyTitle,
                    urgency === 'EMERGENCY' && styles.urgencyTitleEmergencyText,
                  ]}
                >
                  Emergency Blood
                </Text>
              </View>
              <Text
                style={[
                  styles.urgencySub,
                  urgency === 'EMERGENCY' && styles.urgencySubEmergencyText,
                ]}
              >
                Critical need. Displayed in Emergency Blood with URGENT badge.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD 3: Patient & Blood Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Patient & Blood Details</Text>

          {/* Patient Full Name */}
          <CleanInput
            label="Patient Full Name"
            value={patientName}
            onChangeText={setPatientName}
            placeholder="e.g. John Doe"
            icon={<Ionicons name="person-outline" size={18} color="#64748B" />}
          />

          {/* Required Blood Group */}
          <Text style={styles.fieldLabel}>Required Blood Group *</Text>
          <View style={styles.bloodGrid}>
            <View style={styles.bloodRow}>
              {BLOOD_GROUPS.slice(0, 6).map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodPill, isSelected && styles.bloodPillSelected]}
                    onPress={() => setBloodGroup(bg)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.bloodPillText,
                        isSelected && styles.bloodPillTextSelected,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.bloodRow, { marginTop: 8 }]}>
              {BLOOD_GROUPS.slice(6, 8).map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodPill, isSelected && styles.bloodPillSelected]}
                    onPress={() => setBloodGroup(bg)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.bloodPillText,
                        isSelected && styles.bloodPillTextSelected,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Required Units Stepper */}
          <View style={styles.unitsSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.unitsTitle}>Required Units (Bags) *</Text>
              <Text style={styles.unitsSub}>Standard adult unit ≈ 450 ml</Text>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setUnits(Math.max(1, units - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color="#0F172A" />
              </TouchableOpacity>

              <Text style={styles.unitsCount}>{units}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setUnits(Math.min(10, units + 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CARD 4: Hospital Location & Timing */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Hospital Location & Timing</Text>

          {/* Hospital Name */}
          <CleanInput
            label="Hospital Name"
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="e.g. Kathmandu Medical College"
            icon={<Ionicons name="medkit-outline" size={18} color="#64748B" />}
          />

          {/* Hospital Address / Ward / Room */}
          <CleanInput
            label="Hospital Address / Ward / Room"
            value={hospitalAddress}
            onChangeText={setHospitalAddress}
            placeholder="e.g. Ward 4, ICU Bed 12"
          />

          {/* City & Date side-by-side */}
          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <CleanInput
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="City"
              />
            </View>
            <View style={{ flex: 1.1 }}>
              <CleanInput
                label="Required Date"
                value={requiredDate}
                onChangeText={setRequiredDate}
                placeholder="YYYY-MM-DD"
                icon={<Ionicons name="calendar-outline" size={16} color="#64748B" />}
              />
            </View>
          </View>

          {/* Required Time / Urgency Window */}
          <CleanInput
            label="Required Time / Window"
            value={urgencyWindow}
            onChangeText={setUrgencyWindow}
            placeholder="e.g. Immediate / Within 3 hours"
          />
        </View>

        {/* CARD 5: Contact Person & Medical Reason */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Contact Person & Medical Reason</Text>

          {/* Attendant / Doctor Name */}
          <CleanInput
            label="Attendant / Doctor Name"
            value={attendantName}
            onChangeText={setAttendantName}
            placeholder="e.g. Dr. Koirala / Relative Name"
            icon={<Ionicons name="person-outline" size={16} color="#64748B" />}
          />

          {/* Contact Phone Number */}
          <CleanInput
            label="Contact Phone Number"
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="+977-98XXXXXXXX"
            keyboardType="phone-pad"
            icon={<Ionicons name="call-outline" size={16} color="#64748B" />}
          />

          {/* Reason / Medical Condition */}
          <CleanInput
            label="Reason / Medical Condition"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Emergency bypass surgery"
          />

          {/* Additional Clinical Instructions */}
          <CleanInput
            label="Additional Instructions (Optional)"
            value={clinicalInstructions}
            onChangeText={setClinicalInstructions}
            placeholder="Any specific requirement"
          />
        </View>

        {/* CARD 6: Platform Maintenance Fee */}
        <View style={styles.card}>
          <View style={styles.feeHeaderRow}>
            <Text style={styles.feeHeaderTitle}>Platform Maintenance Fee</Text>
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>NPR {platformFee}</Text>
            </View>
          </View>

          <Text style={styles.feeSubtitle}>
            Required for donor dispatch network upkeep
          </Text>

          <Text style={styles.walletLabel}>Select Digital Wallet Provider:</Text>

          <View style={styles.walletRow}>
            {/* eSewa */}
            <TouchableOpacity
              style={[
                styles.walletBtn,
                walletProvider === 'eSewa'
                  ? styles.walletBtnEsewaSelected
                  : styles.walletBtnUnselected,
              ]}
              onPress={() => setWalletProvider('eSewa')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.walletBtnText,
                  walletProvider === 'eSewa' && styles.walletBtnTextSelected,
                ]}
              >
                eSewa
              </Text>
            </TouchableOpacity>

            {/* Khalti */}
            <TouchableOpacity
              style={[
                styles.walletBtn,
                walletProvider === 'Khalti'
                  ? styles.walletBtnKhaltiSelected
                  : styles.walletBtnUnselected,
              ]}
              onPress={() => setWalletProvider('Khalti')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.walletBtnText,
                  walletProvider === 'Khalti'
                    ? styles.walletBtnTextSelected
                    : styles.walletBtnTextKhalti,
                ]}
              >
                Khalti
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions Box */}
          <View style={styles.walletInfoBox}>
            <Text style={styles.walletIdText}>
              {walletProvider === 'eSewa' ? 'eSewa' : 'Khalti'} ID: 9801234567 • Blood Sanjal Network
            </Text>
            <Text style={styles.walletInstructionText}>
              Transfer NPR {platformFee} and paste the Transaction Reference Number below.
            </Text>
          </View>

          {/* Transaction Reference ID / Code */}
          <CleanInput
            label="Transaction Reference ID"
            value={transactionRef}
            onChangeText={setTransactionRef}
            placeholder="e.g. TXN-89472648"
            autoCapitalize="characters"
          />
        </View>

        {/* BOTTOM SUBMIT BUTTON */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.88}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.submitBtnContent}>
              <View style={styles.submitCheckCircle}>
                <Ionicons name="checkmark" size={14} color="#DC2626" />
              </View>
              <Text style={styles.submitBtnText}>Submit Blood Request</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: fonts.bold,
  },
  themeToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FEF08A',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  themeThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeThumbDark: {
    alignSelf: 'flex-end',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
    maxWidth: 110,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: fonts.semiBold,
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: fonts.bold,
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fonts.bold,
    marginBottom: 14,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyOption: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  urgencyOptionNormalSelected: {
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
  },
  urgencyOptionEmergencySelected: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  urgencyOptionEmergencyUnselected: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  urgencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: fonts.bold,
    marginBottom: 6,
    color: '#0F172A',
  },
  urgencyTitleNormalSelected: {
    color: '#0F172A',
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyTitleEmergencyText: {
    color: '#FFFFFF',
  },
  urgencySub: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: '#64748B',
  },
  urgencySubNormalSelected: {
    color: '#475569',
  },
  urgencySubEmergencyText: {
    color: '#FEE2E2',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fonts.semiBold,
    marginBottom: 10,
  },
  bloodGrid: {
    marginBottom: 16,
  },
  bloodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bloodPill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodPillSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  bloodPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fonts.bold,
  },
  bloodPillTextSelected: {
    color: '#FFFFFF',
  },
  unitsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  unitsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fonts.semiBold,
  },
  unitsSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitsCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: fonts.bold,
    minWidth: 18,
    textAlign: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redCrossIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feeHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: fonts.bold,
  },
  feeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
    fontFamily: fonts.bold,
  },
  feeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: fonts.regular,
    marginBottom: 14,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fonts.semiBold,
    marginBottom: 10,
  },
  walletRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  walletBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  walletBtnUnselected: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  walletBtnEsewaSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  walletBtnKhaltiSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  walletBtnText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: fonts.bold,
    color: '#0F172A',
  },
  walletBtnTextSelected: {
    color: '#FFFFFF',
  },
  walletBtnTextKhalti: {
    color: '#5B21B6',
  },
  walletInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  walletIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: fonts.semiBold,
    marginBottom: 4,
  },
  walletInstructionText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: fonts.bold,
  },

  // Clean Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#334155',
    fontFamily: fonts.medium,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputWrapperFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: fonts.regular,
    paddingVertical: 12,
  },
});
