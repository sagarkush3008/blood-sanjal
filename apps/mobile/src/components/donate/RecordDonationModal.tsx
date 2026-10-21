import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { DonationsAPI } from '../../api/donations.api';
import { useDonationStore } from '../../store/donationStore';
import { scheduleEligibilityNotification } from '../../services/notification.service';
import { CalendarPickerModal } from '../common/CalendarPickerModal';
import { DualCalendarDatePicker } from './DualCalendarDatePicker';

export interface RecordDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

// Brand & Semantic Design Tokens
const BRAND_RED = '#E63946';
const SLATE_900 = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_400 = '#94A3B8';
const SLATE_100 = '#F1F5F9';
const SLATE_50 = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

export const RecordDonationModal: React.FC<RecordDonationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const setCooldown = useDonationStore((state) => state.setCooldown);

  // Helper for mm/dd/yyyy format
  const getTodayFormatted = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Form State: Authoritative Gregorian AD Date
  const [selectedAdDate, setSelectedAdDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>('Narayani Hospital, Birgunj');
  const [campaign, setCampaign] = useState<string>('-- Independent Voluntary Donation --');
  const [showCampaignPicker, setShowCampaignPicker] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [permissionToPostSocial, setPermissionToPostSocial] = useState<boolean>(true);

  // Media & Interaction State
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const campaignOptions = [
    '-- Independent Voluntary Donation --',
    'Birgunj Youth Red Cross Blood Drive 2026',
    'Narayani Hospital Emergency Life Camp',
    'Rotary Club Birgunj Mega Donation Camp',
  ];

  // Image Selection Handler (Camera / Gallery)
  const handlePickImage = () => {
    Alert.alert(
      'Attach Donation Proof',
      'Select a photo of you donating blood or holding your donation slip.',
      [
        {
          text: 'Take Selfie / Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              setPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Photo library permission is required to choose an image.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]?.uri) {
              setPhotoUri(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Convert mm/dd/yyyy to ISO String
  const parseDateToISO = (dateStr: string): string => {
    try {
      const parts = dateStr.trim().split('/');
      if (parts.length === 3) {
        const mm = parseInt(parts[0], 10) - 1;
        const dd = parseInt(parts[1], 10);
        const yyyy = parseInt(parts[2], 10);
        const d = new Date(Date.UTC(yyyy, mm, dd));
        if (!isNaN(d.getTime())) return d.toISOString();
      }
    } catch {}
    return new Date().toISOString();
  };

  // Form Submission
  const handleSubmit = async () => {
    if (!selectedAdDate || isNaN(selectedAdDate.getTime())) {
      Alert.alert('Validation Error', 'Please select a valid donation date.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter the donation location or hospital name.');
      return;
    }

    setIsSubmitting(true);
    try {
      // CRITICAL: Always format authoritative Gregorian AD Date to standard ISO string
      const isoDate = selectedAdDate.toISOString();

      // Build FormData payload
      const formData = new FormData();
      formData.append('donationDate', isoDate);
      formData.append('hospitalName', location.trim());
      formData.append('location', location.trim());
      if (campaign && campaign !== '-- Independent Voluntary Donation --') {
        formData.append('campaignId', campaign);
      }
      formData.append('notes', notes.trim());
      formData.append('permissionToPostSocial', permissionToPostSocial ? 'true' : 'false');

      if (photoUri) {
        const filename = photoUri.split('/').pop() || `donation_proof_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('photo', {
          uri: photoUri,
          name: filename,
          type,
        } as any);
      }

      // 1. Submit to Backend
      const res = await DonationsAPI.recordWithProof(formData);
      const resData = res?.data || res;

      // 2. PART 2: Global State Mutation (Zustand 90-day Cooldown)
      const { nextEligibleDate } = await setCooldown(isoDate);

      // 3. PART 3: Automated Local Notification Scheduling (Exact 90 Days)
      await scheduleEligibilityNotification(nextEligibleDate);

      // 4. Invalidate React Query caches for immediate UI reactivity
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });

      Alert.alert(
        'Donation Recorded Successfully! 🩸',
        'Thank you for your generous contribution. Your 90-day recovery cooldown has begun. We will notify you when you are eligible to donate again.',
        [
          {
            text: 'View Countdown',
            onPress: () => {
              if (onSuccess) onSuccess(resData);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('[RecordDonationModal] Submission error:', err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to record blood donation. Please verify your connection and try again.';
      Alert.alert('Submission Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="water" size={17} color={BRAND_RED} />
              </View>
              <Text style={styles.headerTitleText}>Record Blood Donation</Text>
            </View>
            <TouchableOpacity
              style={styles.headerCloseButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close donation modal"
            >
              <Ionicons name="close" size={20} color={SLATE_600} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Guidance Banner */}
            <View style={styles.guidanceBanner}>
              <View style={styles.guidanceHeaderRow}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.guidanceHeading}>Medical & Health Guidance</Text>
              </View>
              <Text style={styles.guidanceCopy}>
                Blood donation eligibility depends on your personal health status, hemoglobin level, and medical guidelines prescribed by Narayani Hospital or Red Cross blood donation services.
              </Text>
            </View>

            {/* 2. Date Selection Module: AD / BS Dual Calendar Toggle */}
            <DualCalendarDatePicker
              value={selectedAdDate}
              onChange={(adDate) => setSelectedAdDate(adDate)}
              label="Donation Date *"
              maxDate={new Date()}
            />

            {/* 3. Location Input */}
            <View style={styles.formFieldGroup}>
              <Text style={styles.fieldLabel}>Donation Location / Hospital *</Text>
              <View style={styles.fieldInputWrapper}>
                <Ionicons name="location-outline" size={18} color={SLATE_400} style={styles.fieldLeadIcon} />
                <TextInput
                  style={styles.textInputControl}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Narayani Hospital, Birgunj"
                  placeholderTextColor={SLATE_400}
                  accessibilityLabel="Donation Location input"
                />
              </View>
            </View>

            {/* 4. Campaign Selector */}
            <View style={styles.formFieldGroup}>
              <Text style={styles.fieldLabel}>Associated Campaign (Optional)</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setShowCampaignPicker(!showCampaignPicker)}
                activeOpacity={0.8}
                accessibilityLabel="Associated Campaign selector"
              >
                <Text style={styles.dropdownTriggerValue} numberOfLines={1}>
                  {campaign}
                </Text>
                <Ionicons
                  name={showCampaignPicker ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={SLATE_600}
                />
              </TouchableOpacity>

              {showCampaignPicker && (
                <View style={styles.dropdownPopover}>
                  {campaignOptions.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dropdownOptionRow,
                        campaign === opt && styles.dropdownOptionRowActive,
                      ]}
                      onPress={() => {
                        setCampaign(opt);
                        setShowCampaignPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionLabel,
                          campaign === opt && styles.dropdownOptionLabelActive,
                        ]}
                      >
                        {opt}
                      </Text>
                      {campaign === opt && (
                        <Ionicons name="checkmark" size={16} color={BRAND_RED} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 5. Media Upload Zone */}
            <View style={styles.uploadSectionContainer}>
              <View style={styles.uploadSectionHeader}>
                <View style={styles.uploadTitleRow}>
                  <Feather name="camera" size={16} color={BRAND_RED} />
                  <Text style={styles.uploadSectionTitle}>Upload Donor Photo (You Donating Blood)</Text>
                </View>
                <View style={styles.socialSpotlightBadge}>
                  <Text style={styles.socialSpotlightText}>Social Spotlight</Text>
                </View>
              </View>

              <Text style={styles.uploadSectionDescription}>
                Upload a picture of you donating blood or holding your donor certificate. We feature verified donors on our social media to inspire the community.
              </Text>

              {photoUri ? (
                <View style={styles.thumbnailPreviewBox}>
                  <Image source={{ uri: photoUri }} style={styles.thumbnailImg} resizeMode="cover" />
                  <View style={styles.thumbnailFooterBar}>
                    <TouchableOpacity
                      style={styles.thumbnailActionBtn}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="swap-horizontal" size={15} color={SLATE_900} />
                      <Text style={styles.thumbnailActionText}>Change Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.thumbnailActionBtn, styles.thumbnailDeleteBtn]}
                      onPress={() => setPhotoUri(null)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={[styles.thumbnailActionText, { color: '#DC2626' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.dashedDropzone}>
                  <Ionicons name="cloud-upload-outline" size={32} color={SLATE_400} />
                  <Text style={styles.dropzoneTitleText}>Upload Your Donation Photo</Text>
                  <Text style={styles.dropzoneSubtitleText}>Take a selfie or choose image from gallery</Text>
                  <TouchableOpacity
                    style={styles.outlinePickerButton}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Feather name="image" size={15} color={SLATE_900} style={{ marginRight: 6 }} />
                    <Text style={styles.outlinePickerButtonText}>Choose Image</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 6. Consent Checkbox */}
              <TouchableOpacity
                style={styles.consentCard}
                onPress={() => setPermissionToPostSocial(!permissionToPostSocial)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={permissionToPostSocial ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={permissionToPostSocial ? BRAND_RED : SLATE_400}
                />
                <View style={styles.consentTextColumn}>
                  <Text style={styles.consentTitleText}>Permission to Post on Social Media</Text>
                  <Text style={styles.consentDescriptionText}>
                    I agree and authorize Blood Sanjal Nepal to share my photo, name, and blood donation recognition on official social media channels to inspire other citizens to donate blood.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 7. Remarks Input */}
            <View style={styles.formFieldGroup}>
              <Text style={styles.fieldLabel}>Additional Notes / Experience</Text>
              <TextInput
                style={[styles.textInputControl, styles.multilineAreaControl]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Smooth donation experience with Red Cross team in Birgunj."
                placeholderTextColor={SLATE_400}
                multiline
                numberOfLines={3}
                accessibilityLabel="Additional notes input"
              />
            </View>

            {/* 8. Primary Action Button */}
            <TouchableOpacity
              style={[styles.primarySubmitBtn, isSubmitting && styles.primarySubmitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
              accessibilityLabel="Submit Donation Record button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.primaryBtnInnerRow}>
                  <Ionicons name="water" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primarySubmitBtnText}>Submit Donation Record</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: SLATE_900,
  },
  headerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SLATE_100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 36,
  },
  guidanceBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },
  guidanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guidanceHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  guidanceCopy: {
    fontSize: 12,
    color: SLATE_700,
    lineHeight: 18,
  },
  formFieldGroup: {
    marginBottom: 16,
  },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  calendarChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_RED,
  },
  calendarActionIconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SLATE_700,
    marginBottom: 6,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldLeadIcon: {
    marginRight: 8,
  },
  textInputControl: {
    flex: 1,
    fontSize: 14,
    color: SLATE_900,
  },
  multilineAreaControl: {
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownTriggerValue: {
    flex: 1,
    fontSize: 14,
    color: SLATE_900,
  },
  dropdownPopover: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_50,
  },
  dropdownOptionRowActive: {
    backgroundColor: '#FFF1F2',
  },
  dropdownOptionLabel: {
    fontSize: 13,
    color: SLATE_700,
  },
  dropdownOptionLabelActive: {
    fontWeight: '700',
    color: BRAND_RED,
  },
  uploadSectionContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  uploadSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  uploadSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_900,
    flexShrink: 1,
  },
  socialSpotlightBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  socialSpotlightText: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND_RED,
  },
  uploadSectionDescription: {
    fontSize: 12,
    color: SLATE_600,
    lineHeight: 17,
    marginBottom: 12,
  },
  dashedDropzone: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: SLATE_50,
  },
  dropzoneTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_900,
    marginTop: 6,
  },
  dropzoneSubtitleText: {
    fontSize: 11,
    color: SLATE_600,
    marginTop: 2,
    marginBottom: 12,
  },
  outlinePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  outlinePickerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE_900,
  },
  thumbnailPreviewBox: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: SLATE_100,
  },
  thumbnailImg: {
    width: '100%',
    height: 160,
  },
  thumbnailFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  thumbnailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: SLATE_100,
  },
  thumbnailDeleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  thumbnailActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: SLATE_900,
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 11,
    marginTop: 12,
  },
  consentTextColumn: {
    flex: 1,
  },
  consentTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 2,
  },
  consentDescriptionText: {
    fontSize: 11,
    color: '#4C0519',
    lineHeight: 16,
  },
  primarySubmitBtn: {
    backgroundColor: BRAND_RED,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  primarySubmitBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primarySubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
