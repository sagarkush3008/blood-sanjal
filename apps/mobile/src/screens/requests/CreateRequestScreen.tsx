import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BloodRequestsAPI } from '../../api/requests.api';
import { useAuthStore } from '../../store/authStore';
import { cleanLocationName } from '../../utils/locationHelper';

// Typography Tokens
const FONT_REGULAR = 'Inter_400Regular';
const FONT_MEDIUM = 'Inter_500Medium';
const FONT_SEMIBOLD = 'Inter_600SemiBold';
const FONT_BOLD = 'Inter_700Bold';

// Color Palette
const BRAND_RED = '#DC2626';
const BRAND_RED_LIGHT = '#FEF2F2';
const BORDER_COLOR = '#E2E8F0';
const BORDER_FOCUS = '#DC2626';
const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#64748B';
const BG_SURFACE = '#FFFFFF';
const BG_PAGE = '#F8FAFC';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const TIMEFRAMES = ['Immediate', 'Within 3 Hours', 'Today', 'Tomorrow'];

interface MinimalInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  required?: boolean;
}

const MinimalInput: React.FC<MinimalInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.asterisk}>*</Text>}
      </Text>
      <View style={[styles.inputFieldWrapper, isFocused && styles.inputFieldFocused]}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={17}
            color={isFocused ? BRAND_RED : '#94A3B8'}
            style={styles.inputFieldIcon}
          />
        )}
        <TextInput
          style={styles.inputFieldText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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

  // Form State
  const initialUrgency = route.params?.urgency === 'EMERGENCY' ? 'EMERGENCY' : 'NORMAL';
  const initialGroup = route.params?.bloodGroup || 'O+';

  const [urgency, setUrgency] = useState<'NORMAL' | 'EMERGENCY'>(initialUrgency);
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>(initialGroup);
  const [units, setUnits] = useState<number>(2);

  // Hospital & Location
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [urgencyWindow, setUrgencyWindow] = useState('Immediate');

  // Attendant Contact & Reason
  const [attendantName, setAttendantName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [reason, setReason] = useState('Surgical procedure / blood replacement');
  const [clinicalInstructions, setClinicalInstructions] = useState('');

  // Platform Verification Fee
  const [walletProvider, setWalletProvider] = useState<'eSewa' | 'Khalti'>('eSewa');
  const [transactionRef, setTransactionRef] = useState('');
  const platformFee = 15;

  // Handle Return from Map Location Picker
  useEffect(() => {
    if (route.params?.selectedLocation) {
      const cleanLoc = cleanLocationName(route.params.selectedLocation);
      setHospitalName(cleanLoc);
      if (route.params?.locationAddress) {
        setHospitalAddress(cleanLocationName(route.params.locationAddress));
      }
      const parts = cleanLoc.split(',');
      if (parts.length > 1) {
        setCity(parts[parts.length - 1].trim());
      } else {
        setCity(cleanLoc);
      }
    }
  }, [route.params?.selectedLocation, route.params?.locationAddress]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => BloodRequestsAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-requests'] });
      queryClient.invalidateQueries({ queryKey: ['platform-metrics'] });
      Alert.alert(
        'Request Published 🩸',
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

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Urgency Segmented Control (Minimal & High Contrast) */}
        <View style={styles.urgencySegmentWrapper}>
          <TouchableOpacity
            style={[
              styles.urgencySegmentBtn,
              urgency === 'NORMAL' && styles.urgencySegmentBtnActiveNormal,
            ]}
            onPress={() => setUrgency('NORMAL')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.urgencySegmentText,
                urgency === 'NORMAL' && styles.urgencySegmentTextActive,
              ]}
            >
              Normal Request
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.urgencySegmentBtn,
              urgency === 'EMERGENCY' && styles.urgencySegmentBtnActiveEmergency,
            ]}
            onPress={() => setUrgency('EMERGENCY')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="alert-circle"
              size={15}
              color={urgency === 'EMERGENCY' ? '#FFFFFF' : BRAND_RED}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.urgencySegmentText,
                urgency === 'EMERGENCY'
                  ? styles.urgencySegmentTextActiveEmergency
                  : styles.urgencySegmentTextInactiveEmergency,
              ]}
            >
              Emergency Blood
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. CARD: Patient & Blood Requirement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient & Blood Details</Text>

          {/* Patient Full Name */}
          <MinimalInput
            label="Patient Full Name"
            value={patientName}
            onChangeText={setPatientName}
            placeholder="e.g. Maya Shrestha"
            iconName="person-outline"
            required
            autoCapitalize="words"
          />

          {/* Symmetrical 4x2 Blood Group Grid */}
          <View style={styles.fieldBlock}>
            <Text style={styles.inputLabel}>
              Required Blood Group <Text style={styles.asterisk}>*</Text>
            </Text>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[
                      styles.bloodChip,
                      isSelected ? styles.bloodChipSelected : styles.bloodChipUnselected,
                    ]}
                    onPress={() => setBloodGroup(bg)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.bloodChipText,
                        isSelected ? styles.bloodChipTextSelected : styles.bloodChipTextUnselected,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Units Needed Stepper */}
          <View style={styles.unitsRow}>
            <View>
              <Text style={styles.inputLabel}>Required Units (Bags)</Text>
              <Text style={styles.unitsHelperText}>Standard adult unit ≈ 450 ml</Text>
            </View>

            <View style={styles.stepperBox}>
              <TouchableOpacity
                style={[styles.stepperActionBtn, units <= 1 && styles.stepperActionBtnDisabled]}
                onPress={() => setUnits(Math.max(1, units - 1))}
                disabled={units <= 1}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={17} color={units <= 1 ? '#CBD5E1' : TEXT_PRIMARY} />
              </TouchableOpacity>

              <Text style={styles.stepperValue}>{units}</Text>

              <TouchableOpacity
                style={[styles.stepperActionBtn, units >= 10 && styles.stepperActionBtnDisabled]}
                onPress={() => setUnits(Math.min(10, units + 1))}
                disabled={units >= 10}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={17} color={units >= 10 ? '#CBD5E1' : TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. CARD: Hospital Location & Timing */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Hospital Location & Timing</Text>
            <TouchableOpacity
              style={styles.mapActionBtn}
              onPress={() =>
                navigation.navigate('LocationPicker', {
                  selectedLocation: hospitalName || city,
                  returnScreen: 'CreateRequest',
                })
              }
              activeOpacity={0.75}
            >
              <Ionicons name="map-outline" size={13} color={BRAND_RED} />
              <Text style={styles.mapActionText}>Pick on Map</Text>
            </TouchableOpacity>
          </View>

          {/* Hospital Name */}
          <MinimalInput
            label="Hospital Name"
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="e.g. Kathmandu Medical College"
            iconName="medkit-outline"
            required
          />

          {/* Hospital Address / Ward / Room */}
          <MinimalInput
            label="Hospital Address / Ward / Bed"
            value={hospitalAddress}
            onChangeText={setHospitalAddress}
            placeholder="e.g. Ward 4, ICU Bed 12"
          />

          {/* City & Date Row */}
          <View style={styles.twoColumnRow}>
            <View style={{ flex: 1 }}>
              <MinimalInput
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="City"
              />
            </View>
            <View style={{ flex: 1.1 }}>
              <MinimalInput
                label="Required Date"
                value={requiredDate}
                onChangeText={setRequiredDate}
                placeholder="YYYY-MM-DD"
                iconName="calendar-outline"
              />
            </View>
          </View>

          {/* Required Timeframe Pill Row */}
          <View style={styles.fieldBlock}>
            <Text style={styles.inputLabel}>Required Time Window</Text>
            <View style={styles.pillWrapRow}>
              {TIMEFRAMES.map((t) => {
                const isSelected = urgencyWindow === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.timeframePill,
                      isSelected ? styles.timeframePillSelected : styles.timeframePillUnselected,
                    ]}
                    onPress={() => setUrgencyWindow(t)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeframePillText,
                        isSelected && styles.timeframePillTextSelected,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. CARD: Attendant Contact & Medical Reason */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Person & Medical Reason</Text>

          <MinimalInput
            label="Attendant / Doctor Name"
            value={attendantName}
            onChangeText={setAttendantName}
            placeholder="e.g. Dr. Koirala / Relative Name"
            iconName="person-outline"
          />

          <MinimalInput
            label="Contact Phone Number"
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="98XXXXXXXX"
            keyboardType="phone-pad"
            iconName="call-outline"
            required
          />

          <MinimalInput
            label="Reason / Medical Condition"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Emergency surgery / anemia replacement"
          />

          {/* Additional Instructions */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Instructions (Optional)</Text>
            <View style={[styles.inputFieldWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.inputFieldText, styles.textAreaText]}
                value={clinicalInstructions}
                onChangeText={setClinicalInstructions}
                placeholder="Any special requirements, cross-match instructions..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* 5. CARD: Platform Verification Fee (Streamlined & Clean) */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View>
              <Text style={styles.cardTitle}>Platform Maintenance Fee</Text>
              <Text style={styles.feeSubText}>Donor network upkeep & SMS alerts</Text>
            </View>
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>NPR {platformFee}</Text>
            </View>
          </View>

          {/* Wallet Toggle */}
          <View style={styles.walletToggleRow}>
            <TouchableOpacity
              style={[
                styles.walletOptionBtn,
                walletProvider === 'eSewa' && styles.walletOptionEsewaSelected,
              ]}
              onPress={() => setWalletProvider('eSewa')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.walletOptionText,
                  walletProvider === 'eSewa' ? styles.walletOptionTextSelected : styles.walletOptionTextEsewa,
                ]}
              >
                eSewa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.walletOptionBtn,
                walletProvider === 'Khalti' && styles.walletOptionKhaltiSelected,
              ]}
              onPress={() => setWalletProvider('Khalti')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.walletOptionText,
                  walletProvider === 'Khalti' ? styles.walletOptionTextSelected : styles.walletOptionTextKhalti,
                ]}
              >
                Khalti
              </Text>
            </TouchableOpacity>
          </View>

          {/* Wallet Reference Info Box */}
          <View style={styles.walletInfoBox}>
            <Text style={styles.walletIdText}>
              {walletProvider === 'eSewa' ? 'eSewa' : 'Khalti'} ID: <Text style={{ fontFamily: FONT_BOLD, color: TEXT_PRIMARY }}>9801234567</Text>
            </Text>
            <Text style={styles.walletInfoSub}>
              Transfer NPR {platformFee} and enter reference code below:
            </Text>
          </View>

          <MinimalInput
            label="Transaction Reference ID"
            value={transactionRef}
            onChangeText={setTransactionRef}
            placeholder="e.g. TXN-89472648"
            autoCapitalize="characters"
          />
        </View>

        {/* 6. Primary Action Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitBtn, createMutation.isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            activeOpacity={0.85}
          >
            {createMutation.isPending ? (
              <View style={styles.submitBtnContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitBtnText}>Broadcasting Request...</Text>
              </View>
            ) : (
              <View style={styles.submitBtnContent}>
                <Ionicons
                  name={urgency === 'EMERGENCY' ? 'flash' : 'paper-plane'}
                  size={17}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitBtnText}>
                  {urgency === 'EMERGENCY' ? 'Post Emergency Broadcast' : 'Submit Blood Request'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: BG_PAGE,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Urgency Segmented Control */
  urgencySegmentWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  urgencySegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
  },
  urgencySegmentBtnActiveNormal: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  urgencySegmentBtnActiveEmergency: {
    backgroundColor: BRAND_RED,
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  urgencySegmentText: {
    fontSize: 13,
    fontFamily: FONT_MEDIUM,
    color: '#64748B',
  },
  urgencySegmentTextActive: {
    fontFamily: FONT_BOLD,
    color: TEXT_PRIMARY,
  },
  urgencySegmentTextActiveEmergency: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
  },
  urgencySegmentTextInactiveEmergency: {
    color: BRAND_RED,
    fontFamily: FONT_SEMIBOLD,
  },

  /* Card Surfaces */
  card: {
    backgroundColor: BG_SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 16,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: TEXT_PRIMARY,
    marginBottom: 14,
  },

  /* Inputs */
  fieldBlock: {
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT_SEMIBOLD,
    color: '#334155',
    marginBottom: 6,
  },
  asterisk: {
    color: BRAND_RED,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputFieldFocused: {
    borderColor: BORDER_FOCUS,
  },
  inputFieldIcon: {
    marginRight: 8,
  },
  inputFieldText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_MEDIUM,
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  textAreaWrapper: {
    height: 68,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  textAreaText: {
    height: '100%',
  },

  /* Blood Group 4x2 Symmetrical Grid */
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    width: '23%',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  bloodChipUnselected: {
    backgroundColor: '#F8FAFC',
    borderColor: BORDER_COLOR,
  },
  bloodChipSelected: {
    backgroundColor: BRAND_RED,
    borderColor: BRAND_RED,
  },
  bloodChipText: {
    fontSize: 14,
  },
  bloodChipTextUnselected: {
    fontFamily: FONT_SEMIBOLD,
    color: '#334155',
  },
  bloodChipTextSelected: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
  },

  /* Units Stepper */
  unitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  unitsHelperText: {
    fontSize: 11.5,
    fontFamily: FONT_REGULAR,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperActionBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  stepperValue: {
    fontSize: 17,
    fontFamily: FONT_BOLD,
    color: BRAND_RED,
    paddingHorizontal: 16,
  },

  /* Map Button */
  mapActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_RED_LIGHT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  mapActionText: {
    fontSize: 12,
    fontFamily: FONT_SEMIBOLD,
    color: BRAND_RED,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },

  /* Timeframe Pills */
  pillWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeframePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeframePillUnselected: {
    backgroundColor: '#F8FAFC',
    borderColor: BORDER_COLOR,
  },
  timeframePillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  timeframePillText: {
    fontSize: 12,
    fontFamily: FONT_MEDIUM,
    color: '#475569',
  },
  timeframePillTextSelected: {
    fontFamily: FONT_SEMIBOLD,
    color: '#FFFFFF',
  },

  /* Fee & Payment */
  feeSubText: {
    fontSize: 11.5,
    fontFamily: FONT_REGULAR,
    color: TEXT_SECONDARY,
    marginTop: -8,
  },
  feeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feeBadgeText: {
    fontSize: 12,
    fontFamily: FONT_BOLD,
    color: '#2563EB',
  },
  walletToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  walletOptionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletOptionEsewaSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  walletOptionKhaltiSelected: {
    backgroundColor: '#5C2D91',
    borderColor: '#5C2D91',
  },
  walletOptionText: {
    fontSize: 14,
    fontFamily: FONT_BOLD,
  },
  walletOptionTextEsewa: {
    color: '#16A34A',
  },
  walletOptionTextKhalti: {
    color: '#5C2D91',
  },
  walletOptionTextSelected: {
    color: '#FFFFFF',
  },
  walletInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 14,
  },
  walletIdText: {
    fontSize: 12.5,
    fontFamily: FONT_MEDIUM,
    color: TEXT_SECONDARY,
    marginBottom: 2,
  },
  walletInfoSub: {
    fontSize: 11.5,
    fontFamily: FONT_REGULAR,
    color: '#64748B',
  },

  /* Submit Action Button */
  submitContainer: {
    marginTop: 4,
  },
  submitBtn: {
    width: '100%',
    height: 50,
    backgroundColor: BRAND_RED,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.75,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
