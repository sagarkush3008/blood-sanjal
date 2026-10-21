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
import { DualCalendarDatePicker } from './DualCalendarDatePicker';
import { fonts } from '../../theme';

export interface RecordDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

// Brand Red strictly for CTA and active toggles; neutrals for flat, airy canvas
const BRAND_RED = '#E63946';

export const RecordDonationModal: React.FC<RecordDonationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const setCooldown = useDonationStore((state) => state.setCooldown);

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

      // 2. Global State Mutation (Zustand 90-day Cooldown)
      const { nextEligibleDate } = await setCooldown(isoDate);

      // 3. Automated Local Notification Scheduling (Exact 90 Days)
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
          {/* Apple-style top drag handle */}
          <View style={styles.sheetDragHandle} />

          {/* Minimal Header Bar (No divider line) */}
          <View style={styles.headerBar}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="water" size={16} color={BRAND_RED} />
              </View>
              <Text style={styles.headerTitleText}>Record Blood Donation</Text>
            </View>
            <TouchableOpacity
              style={styles.headerCloseButton}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close donation modal"
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. De-cluttered, Soft Guidance Box */}
            <View style={styles.guidanceBanner}>
              <View style={styles.guidanceHeaderRow}>
                <Ionicons name="information-circle-outline" size={15} color="#6B7280" />
                <Text style={styles.guidanceHeading}>Medical & Health Guidance</Text>
              </View>
              <Text style={styles.guidanceCopy}>
                Blood donation eligibility depends on your health status, hemoglobin level, and medical guidelines prescribed by Narayani Hospital or Red Cross blood donation services.
              </Text>
            </View>

            {/* 2. Date Selection Module: AD / BS Dual Calendar Toggle (Airy 28px vertical gap) */}
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
                <Ionicons name="location-outline" size={18} color="#9CA3AF" style={styles.fieldLeadIcon} />
                <TextInput
                  style={styles.textInputControl}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Narayani Hospital, Birgunj"
                  placeholderTextColor="#9CA3AF"
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
                  color="#9CA3AF"
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

            {/* 5. Minimal Media Upload Zone */}
            <View style={styles.uploadSectionContainer}>
              <View style={styles.uploadSectionHeader}>
                <View style={styles.uploadTitleRow}>
                  <Feather name="camera" size={15} color="#4B5563" />
                  <Text style={styles.uploadSectionTitle}>Upload Donor Photo</Text>
                </View>
                <Text style={styles.socialSpotlightTag}>Community Spotlight</Text>
              </View>

              <Text style={styles.uploadSectionDescription}>
                Attach a photo of you donating blood or holding your donor slip to inspire the community.
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
                      <Ionicons name="swap-horizontal" size={15} color="#374151" />
                      <Text style={styles.thumbnailActionText}>Change</Text>
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
                <View style={styles.flatDropzone}>
                  <Ionicons name="cloud-upload-outline" size={26} color="#9CA3AF" />
                  <Text style={styles.dropzoneTitleText}>Upload photo proof</Text>
                  <Text style={styles.dropzoneSubtitleText}>Take a selfie or select from gallery</Text>
                  <TouchableOpacity
                    style={styles.outlinePickerButton}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Feather name="image" size={14} color="#374151" style={{ marginRight: 6 }} />
                    <Text style={styles.outlinePickerButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 6. Soft Minimal Consent Checkbox */}
              <TouchableOpacity
                style={styles.consentCard}
                onPress={() => setPermissionToPostSocial(!permissionToPostSocial)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={permissionToPostSocial ? 'checkbox' : 'square-outline'}
                  size={19}
                  color={permissionToPostSocial ? BRAND_RED : '#9CA3AF'}
                />
                <View style={styles.consentTextColumn}>
                  <Text style={styles.consentTitleText}>Permission to share recognition</Text>
                  <Text style={styles.consentDescriptionText}>
                    I authorize Blood Sanjal Nepal to share my photo and donation milestone on official social channels.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 7. Remarks Input */}
            <View style={styles.formFieldGroup}>
              <Text style={styles.fieldLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.multilineAreaControl}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Smooth donation experience with Red Cross team in Birgunj."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                accessibilityLabel="Additional notes input"
              />
            </View>

            {/* 8. Primary Action Focus Button */}
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
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    // Zero divider line for a clean flat look
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#111827',
  },
  headerCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    paddingHorizontal: 22,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  guidanceBanner: {
    backgroundColor: '#F9FAFB', // Flat soft light neutral
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 28, // Airy vertical spacing
  },
  guidanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guidanceHeading: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  guidanceCopy: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 17,
  },
  formFieldGroup: {
    marginBottom: 28, // Massive whitespace between form sections
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  fieldInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', // Flat subtle gray
    borderWidth: 1,
    borderColor: '#E5E7EB', // Faint 1px border
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52, // Taller input for breathing room
  },
  fieldLeadIcon: {
    marginRight: 10,
  },
  textInputControl: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#111827',
  },
  multilineAreaControl: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    height: 84,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: '#111827',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  dropdownTriggerValue: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#111827',
  },
  dropdownPopover: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  dropdownOptionRowActive: {
    backgroundColor: '#FEF2F2',
  },
  dropdownOptionLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#374151',
  },
  dropdownOptionLabelActive: {
    fontFamily: fonts.semiBold,
    color: BRAND_RED,
  },
  uploadSectionContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 28,
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
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: '#111827',
    flexShrink: 1,
  },
  socialSpotlightTag: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  uploadSectionDescription: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 14,
  },
  flatDropzone: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // Clean solid border (no aggressive dashes)
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  dropzoneTitleText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#374151',
    marginTop: 6,
  },
  dropzoneSubtitleText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 10,
  },
  outlinePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  outlinePickerButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#374151',
  },
  thumbnailPreviewBox: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  thumbnailImg: {
    width: '100%',
    height: 160,
  },
  thumbnailFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  thumbnailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  thumbnailDeleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  thumbnailActionText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#374151',
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  consentTextColumn: {
    flex: 1,
  },
  consentTitleText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  consentDescriptionText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  primarySubmitBtn: {
    backgroundColor: BRAND_RED,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: BRAND_RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  primarySubmitBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primarySubmitBtnText: {
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
