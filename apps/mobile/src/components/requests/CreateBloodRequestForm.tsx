import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Typography Tokens
const FONT_REGULAR = 'Inter_400Regular';
const FONT_MEDIUM = 'Inter_500Medium';
const FONT_SEMIBOLD = 'Inter_600SemiBold';
const FONT_BOLD = 'Inter_700Bold';

// Brand Color Palette (Locally Scoped)
const BRAND_RED = '#E63946';
const BRAND_RED_LIGHT = '#FDE8E9';
const BORDER_COLOR = '#E2E8F0';
const BORDER_FOCUS = '#E63946';
const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#64748B';
const BG_INPUT = '#FFFFFF';
const BG_SURFACE = '#F8FAFC';
const ERROR_RED = '#DC2626';

export type UrgencyOption = 'Emergency' | 'Today' | 'Tomorrow';

export interface CreateBloodRequestFormData {
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospital: string;
  contactNumber: string;
  urgency: UrgencyOption;
  notes?: string;
}

export interface CreateBloodRequestFormProps {
  /** Optional callback triggered on form submission */
  onSubmit?: (data: CreateBloodRequestFormData) => Promise<void> | void;
  /** Optional cancel/close callback */
  onCancel?: () => void;
  /** Optional initial default values */
  initialValues?: Partial<CreateBloodRequestFormData>;
  /** Optional wrapper style */
  style?: ViewStyle;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const URGENCY_OPTIONS: UrgencyOption[] = ['Emergency', 'Today', 'Tomorrow'];

export const CreateBloodRequestForm: React.FC<CreateBloodRequestFormProps> = ({
  onSubmit,
  onCancel,
  initialValues,
  style,
}) => {
  // 1. Locally Managed Form State
  const [patientName, setPatientName] = useState(initialValues?.patientName || '');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(initialValues?.bloodGroup || 'O+');
  const [unitsNeeded, setUnitsNeeded] = useState(initialValues?.unitsNeeded || 1);
  const [hospital, setHospital] = useState(initialValues?.hospital || '');
  const [contactNumber, setContactNumber] = useState(initialValues?.contactNumber || '');
  const [urgency, setUrgency] = useState<UrgencyOption>(initialValues?.urgency || 'Emergency');
  const [notes, setNotes] = useState(initialValues?.notes || '');

  // UI / Focus / Validation State
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }
    if (!hospital.trim()) {
      newErrors.hospital = 'Hospital or medical center name is required';
    }
    if (!contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (contactNumber.trim().length < 8) {
      newErrors.contactNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUnitsChange = (delta: number) => {
    setUnitsNeeded((prev) => {
      const next = prev + delta;
      return next >= 1 && next <= 10 ? next : prev;
    });
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData: CreateBloodRequestFormData = {
        patientName: patientName.trim(),
        bloodGroup: selectedBloodGroup,
        unitsNeeded,
        hospital: hospital.trim(),
        contactNumber: contactNumber.trim(),
        urgency,
        notes: notes.trim(),
      };

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Fallback demo timeout simulation
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, style]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Title & Context Header */}
        <View style={styles.formHeader}>
          <View style={styles.titleRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="water" size={18} color={BRAND_RED} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Create Blood Request</Text>
              <Text style={styles.headerSubtitle}>Broadcast urgent donor requirements</Text>
            </View>
          </View>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>

        {/* FIELD 1: Patient Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Patient Name <Text style={styles.requiredAsterisk}>*</Text></Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === 'patientName' && styles.inputWrapperFocused,
              Boolean(errors.patientName) && styles.inputWrapperError,
            ]}
          >
            <Ionicons name="person-outline" size={17} color={TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Maya Shrestha"
              placeholderTextColor="#94A3B8"
              value={patientName}
              onChangeText={(text) => {
                setPatientName(text);
                if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: '' }));
              }}
              onFocus={() => setFocusedInput('patientName')}
              onBlur={() => setFocusedInput(null)}
              autoCapitalize="words"
            />
          </View>
          {Boolean(errors.patientName) && <Text style={styles.errorText}>{errors.patientName}</Text>}
        </View>

        {/* FIELD 2: Blood Group Required (Minimal 2x4 Chip Grid) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Blood Group Required <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <View style={styles.bloodGroupGrid}>
            {BLOOD_GROUPS.map((group) => {
              const isSelected = selectedBloodGroup === group;
              return (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.bloodChip,
                    isSelected ? styles.bloodChipSelected : styles.bloodChipUnselected,
                  ]}
                  onPress={() => setSelectedBloodGroup(group)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Blood group ${group}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.bloodChipText,
                      isSelected ? styles.bloodChipTextSelected : styles.bloodChipTextUnselected,
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FIELD 3: Units Needed (Numeric Stepper) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Units Needed (Pints)</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[styles.stepperButton, unitsNeeded <= 1 && styles.stepperButtonDisabled]}
              onPress={() => handleUnitsChange(-1)}
              disabled={unitsNeeded <= 1}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="remove"
                size={18}
                color={unitsNeeded <= 1 ? '#CBD5E1' : TEXT_PRIMARY}
              />
            </TouchableOpacity>

            <View style={styles.stepperDisplay}>
              <Text style={styles.stepperValueText}>{unitsNeeded}</Text>
              <Text style={styles.stepperUnitText}>{unitsNeeded === 1 ? 'Pint' : 'Pints'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.stepperButton, unitsNeeded >= 10 && styles.stepperButtonDisabled]}
              onPress={() => handleUnitsChange(1)}
              disabled={unitsNeeded >= 10}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="add"
                size={18}
                color={unitsNeeded >= 10 ? '#CBD5E1' : TEXT_PRIMARY}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* FIELD 4: Hospital / Location (Pin Icon inside input) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hospital / Location <Text style={styles.requiredAsterisk}>*</Text></Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === 'hospital' && styles.inputWrapperFocused,
              Boolean(errors.hospital) && styles.inputWrapperError,
            ]}
          >
            <Ionicons name="location-outline" size={18} color={BRAND_RED} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Bir Hospital, Kathmandu"
              placeholderTextColor="#94A3B8"
              value={hospital}
              onChangeText={(text) => {
                setHospital(text);
                if (errors.hospital) setErrors((prev) => ({ ...prev, hospital: '' }));
              }}
              onFocus={() => setFocusedInput('hospital')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {Boolean(errors.hospital) && <Text style={styles.errorText}>{errors.hospital}</Text>}
        </View>

        {/* FIELD 5: Contact Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Attendant Contact Number <Text style={styles.requiredAsterisk}>*</Text></Text>
          <View
            style={[
              styles.inputWrapper,
              focusedInput === 'contactNumber' && styles.inputWrapperFocused,
              Boolean(errors.contactNumber) && styles.inputWrapperError,
            ]}
          >
            <Ionicons name="call-outline" size={17} color={TEXT_SECONDARY} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 98XXXXXXXX"
              placeholderTextColor="#94A3B8"
              value={contactNumber}
              onChangeText={(text) => {
                setContactNumber(text);
                if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: '' }));
              }}
              onFocus={() => setFocusedInput('contactNumber')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          {Boolean(errors.contactNumber) && <Text style={styles.errorText}>{errors.contactNumber}</Text>}
        </View>

        {/* FIELD 6: Urgency / Required Timeframe (Segmented Control) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Urgency Level</Text>
          <View style={styles.segmentedTrack}>
            {URGENCY_OPTIONS.map((option) => {
              const isSelected = urgency === option;
              const isEmergency = option === 'Emergency';
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.segmentButton,
                    isSelected && (isEmergency ? styles.segmentButtonEmergency : styles.segmentButtonActive),
                  ]}
                  onPress={() => setUrgency(option)}
                  activeOpacity={0.8}
                >
                  {isEmergency && (
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#DC2626'}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && styles.segmentTextActive,
                      !isSelected && isEmergency && styles.segmentTextEmergencyInactive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FIELD 7: Optional Clinical Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Additional Notes (Optional)</Text>
          <View
            style={[
              styles.inputWrapper,
              styles.textAreaWrapper,
              focusedInput === 'notes' && styles.inputWrapperFocused,
            ]}
          >
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder="Add patient ward, bed number, or special instructions..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setFocusedInput('notes')}
              onBlur={() => setFocusedInput(null)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action Button: Post Blood Request */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Broadcasting Request...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Post Blood Request</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// 100% Strictly Locally Scoped StyleSheet
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND_RED_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONT_BOLD,
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONT_REGULAR,
    color: TEXT_SECONDARY,
    marginTop: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: FONT_SEMIBOLD,
    color: '#334155',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: BRAND_RED,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: BORDER_FOCUS,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: {
    borderColor: ERROR_RED,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT_MEDIUM,
    color: TEXT_PRIMARY,
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 11.5,
    fontFamily: FONT_REGULAR,
    color: ERROR_RED,
    marginTop: 4,
    marginLeft: 2,
  },

  /* Blood Group 2x4 Chip Grid */
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
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
    backgroundColor: BG_SURFACE,
    borderColor: BORDER_COLOR,
  },
  bloodChipSelected: {
    backgroundColor: BRAND_RED,
    borderColor: BRAND_RED,
  },
  bloodChipText: {
    fontSize: 14.5,
    letterSpacing: 0.2,
  },
  bloodChipTextUnselected: {
    fontFamily: FONT_SEMIBOLD,
    color: '#334155',
  },
  bloodChipTextSelected: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
  },

  /* Numeric Stepper */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG_SURFACE,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  stepperDisplay: {
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 18,
    fontFamily: FONT_BOLD,
    color: TEXT_PRIMARY,
  },
  stepperUnitText: {
    fontSize: 11,
    fontFamily: FONT_REGULAR,
    color: TEXT_SECONDARY,
    marginTop: -1,
  },

  /* Urgency Segmented Control */
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonEmergency: {
    backgroundColor: BRAND_RED,
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12.5,
    fontFamily: FONT_MEDIUM,
    color: '#475569',
  },
  segmentTextActive: {
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
  },
  segmentTextEmergencyInactive: {
    color: '#DC2626',
    fontFamily: FONT_SEMIBOLD,
  },

  /* Text Area for Notes */
  textAreaWrapper: {
    height: 78,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  textAreaInput: {
    height: '100%',
  },

  /* Action Button */
  buttonContainer: {
    marginTop: 8,
  },
  submitButton: {
    width: '100%',
    height: 50,
    backgroundColor: BRAND_RED,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: FONT_BOLD,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
