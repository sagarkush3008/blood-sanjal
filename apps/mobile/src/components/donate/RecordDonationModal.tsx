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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { DonationsAPI } from '../../api/donations.api';
import { scheduleEligibilityNotification } from '../../services/notification.service';

export interface RecordDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export const RecordDonationModal: React.FC<RecordDonationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  // Helper for mm/dd/yyyy format
  const getTodayFormatted = () => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Form State
  const [donationDate, setDonationDate] = useState<string>(getTodayFormatted());
  const [location, setLocation] = useState<string>('Narayani Hospital, Birgunj');
  const [campaign, setCampaign] = useState<string>('-- Independent Voluntary Donation --');
  const [showCampaignPicker, setShowCampaignPicker] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [permissionToPostSocial, setPermissionToPostSocial] = useState<boolean>(true);

  // Photo State
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const campaignOptions = [
    '-- Independent Voluntary Donation --',
    'Birgunj Youth Red Cross Blood Drive 2026',
    'Narayani Hospital Emergency Life Camp',
    'Rotary Club Birgunj Mega Donation Camp',
  ];

  // 1. Image Picker (Camera / Gallery)
  const handlePickImage = () => {
    Alert.alert(
      'Upload Donor Photo',
      'Choose a photo of you donating blood or holding your donor certificate.',
      [
        {
          text: 'Take Selfie / Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
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

  // Convert mm/dd/yyyy to ISO string for backend
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
    } catch {
      // fallback
    }
    return new Date().toISOString();
  };

  // 2. Submit Form
  const handleSubmit = async () => {
    if (!donationDate.trim()) {
      Alert.alert('Required Field', 'Please enter a valid donation date (mm/dd/yyyy).');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Required Field', 'Please enter the donation location / hospital.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDate = parseDateToISO(donationDate);

      const formData = new FormData();
      formData.append('donationDate', isoDate);
      formData.append('hospitalName', location);
      formData.append('location', location);
      if (campaign && campaign !== '-- Independent Voluntary Donation --') {
        formData.append('campaignId', campaign);
      }
      formData.append('notes', notes);
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

      // Backend call
      const res = await DonationsAPI.recordWithProof(formData);
      const resData = res?.data || res;

      // Extract next_eligible_date (from backend response or calculated 90 days from submitted date)
      const calculated90DaysDate = new Date(new Date(isoDate).getTime() + 90 * 24 * 60 * 60 * 1000);
      const nextEligibleDate = resData?.next_eligible_date || resData?.nextEligibleDate || calculated90DaysDate.toISOString();

      // PART 3: Schedule Local Notification for exact 90-day cooldown date
      await scheduleEligibilityNotification(nextEligibleDate);

      // PART 2: Global Frontend State Update
      // Invalidate relevant queries so the 90-day countdown timer immediately appears
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });

      Alert.alert(
        'Donation Recorded! 🩸',
        'Thank you for saving lives! Your 90-day recovery cooldown is now active. We will notify you when you are eligible to donate again.',
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
      console.error('Submission error:', err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to record blood donation.';
      Alert.alert('Submission Error', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Top Bar with Title and Close Button */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.redDotIcon}>
                <Ionicons name="water" size={18} color="#E11D48" />
              </View>
              <Text style={styles.modalTitle}>Record Blood Donation</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Guidance Card */}
            <View style={styles.guidanceCard}>
              <View style={styles.guidanceHeaderRow}>
                <Ionicons name="shield-checkmark-outline" size={17} color="#059669" />
                <Text style={styles.guidanceTitle}>Medical & Health Guidance</Text>
              </View>
              <Text style={styles.guidanceText}>
                Blood donation eligibility depends on your personal health status, hemoglobin level, and medical guidelines prescribed by Narayani Hospital or Red Cross blood donation services. Please consult healthcare professionals at the donation venue.
              </Text>
            </View>

            {/* 2. Donation Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Donation Date *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={donationDate}
                  onChangeText={setDonationDate}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 3. Location Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Donation Location / Hospital *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Narayani Hospital, Birgunj"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* 4. Campaign Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Associated Campaign (Optional)</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setShowCampaignPicker(!showCampaignPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                  {campaign}
                </Text>
                <Ionicons
                  name={showCampaignPicker ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>

              {showCampaignPicker && (
                <View style={styles.dropdownMenu}>
                  {campaignOptions.map((opt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dropdownItem,
                        campaign === opt && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setCampaign(opt);
                        setShowCampaignPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          campaign === opt && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 5. Photo Upload Section */}
            <View style={styles.photoSection}>
              <View style={styles.photoHeader}>
                <View style={styles.photoTitleRow}>
                  <Ionicons name="camera-outline" size={18} color="#E11D48" />
                  <Text style={styles.photoTitle}>Upload Donor Photo (You Donating Blood)</Text>
                </View>
                <View style={styles.spotlightBadge}>
                  <Text style={styles.spotlightBadgeText}>Social Spotlight</Text>
                </View>
              </View>

              <Text style={styles.photoSubtext}>
                Upload a picture of you donating blood, at the blood bank bed, or holding your donor certificate. We feature verified donors on our social media to inspire the community.
              </Text>

              {photoUri ? (
                <View style={styles.thumbnailWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.thumbnailImage} resizeMode="cover" />
                  <View style={styles.thumbnailActions}>
                    <TouchableOpacity style={styles.actionPill} onPress={handlePickImage}>
                      <Ionicons name="refresh-outline" size={15} color="#0F172A" />
                      <Text style={styles.actionPillText}>Change</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionPill, { backgroundColor: '#FEE2E2' }]}
                      onPress={() => setPhotoUri(null)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={[styles.actionPillText, { color: '#DC2626' }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dashedUploadBox}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cloud-upload-outline" size={30} color="#64748B" />
                  <Text style={styles.dashedUploadTitle}>Upload Your Donation Photo</Text>
                  <Text style={styles.dashedUploadSubtitle}>Take a selfie or choose image from gallery</Text>
                </TouchableOpacity>
              )}

              {/* 6. Social Permission Checkbox */}
              <TouchableOpacity
                style={styles.socialCard}
                onPress={() => setPermissionToPostSocial(!permissionToPostSocial)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={permissionToPostSocial ? 'checkbox' : 'square-outline'}
                  size={21}
                  color={permissionToPostSocial ? '#E11D48' : '#94A3B8'}
                />
                <View style={styles.socialTextWrap}>
                  <Text style={styles.socialTitle}>Permission to Post on Social Media</Text>
                  <Text style={styles.socialBody}>
                    I agree and authorize Blood Sanjal Nepal to share my photo, name, and blood donation recognition on official social media channels (Facebook, Instagram, Twitter) to encourage other citizens to donate blood.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 7. Additional Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes / Experience</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Smooth donation experience with Red Cross team in Birgunj."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* 8. Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Ionicons name="water" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Submit Donation Record</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDotIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScroll: {
    paddingHorizontal: 20,
  },
  formScrollContent: {
    paddingTop: 16,
    paddingBottom: 36,
  },
  guidanceCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  guidanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  guidanceText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownSelectorText: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF1F2',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
    color: '#E11D48',
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  photoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  photoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  spotlightBadge: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spotlightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  photoSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  dashedUploadBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  dashedUploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  dashedUploadSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  thumbnailWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  thumbnailImage: {
    width: '100%',
    height: 160,
  },
  thumbnailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  socialTextWrap: {
    flex: 1,
  },
  socialTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 2,
  },
  socialBody: {
    fontSize: 11,
    color: '#4C0519',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
