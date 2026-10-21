import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DonationsAPI } from '../../api/donations.api';
import { scheduleEligibilityNotification } from '../../services/notification.service';
import { CalendarPickerModal } from '../../components/common/CalendarPickerModal';
import { DualCalendarDatePicker } from '../../components/donate/DualCalendarDatePicker';
import { fonts, colors } from '../../theme';

interface SelectedImage {
  uri: string;
  name: string;
  type: string;
}

const CAMPAIGN_OPTIONS = [
  { id: '', title: '-- Independent Voluntary Donation --' },
  { id: 'camp-101', title: 'Birgunj Youth Society Mega Blood Camp' },
  { id: 'camp-102', title: 'Narayani Hospital Voluntary Blood Drive' },
  { id: 'camp-103', title: 'Thakur Ram Multiple Campus Blood Camp' },
  { id: 'camp-104', title: 'Adarshanagar Community Lifesaver Drive' },
];

export const RecordDonationScreen = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Form State: Authoritative Gregorian AD Date
  const [selectedAdDate, setSelectedAdDate] = useState<Date>(new Date());
  const [hospitalName, setHospitalName] = useState<string>('Narayani Hospital, Birgunj');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [showCampaignDropdown, setShowCampaignDropdown] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [permissionToPost, setPermissionToPost] = useState<boolean>(true);
  const [photo, setPhoto] = useState<SelectedImage | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // 1. Image Picker: Choose from Gallery or Camera
  const handlePickPhoto = () => {
    Alert.alert(
      'Upload Donor Photo',
      'Please select an option to attach your donation proof:',
      [
        {
          text: '📷 Take a Selfie (Camera)',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required to take a selfie.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              const filename = asset.uri.split('/').pop() || `donor_selfie_${Date.now()}.jpg`;
              const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
              setPhoto({
                uri: asset.uri,
                name: filename,
                type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
              });
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              const filename = asset.uri.split('/').pop() || `donor_proof_${Date.now()}.jpg`;
              const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
              setPhoto({
                uri: asset.uri,
                name: filename,
                type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
              });
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // 2. Submission Mutation using FormData
  const recordMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!selectedAdDate || isNaN(selectedAdDate.getTime())) {
        throw new Error('Please select a valid donation date.');
      }
      if (!hospitalName.trim()) {
        throw new Error('Please enter the donation location or hospital name.');
      }

      // Construct FormData for multipart upload
      const formData = new FormData();
      formData.append('donationDate', selectedAdDate.toISOString());
      formData.append('hospitalName', hospitalName.trim());
      formData.append('location', hospitalName.trim());
      formData.append('campaignId', selectedCampaign || '');
      formData.append('donationType', 'WHOLE_BLOOD');
      formData.append('notes', notes.trim());
      formData.append('permissionToPostSocial', permissionToPost ? 'true' : 'false');

      // Append image if selected
      if (photo) {
        formData.append('photo', {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as any);
      }

      return DonationsAPI.recordWithProof(formData);
    },
    onSuccess: async (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['donor-status'] });

      // Calculate 90 days or extract from response
      const resData = response?.data?.data || response?.data || response;
      const nextDate = resData?.next_eligible_date || resData?.nextEligibleDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      await scheduleEligibilityNotification(nextDate);

      Alert.alert(
        'Donation Submitted! 🩸',
        'Your donation record has been saved and your 90-day recovery cooldown is active. We will notify you when you are eligible to donate again.',
        [
          {
            text: 'View My Impact',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to submit donation record. Please try again.';
      setApiError(msg);
      Alert.alert('Submission Error', msg);
    },
  });

  const handleSubmit = () => {
    setApiError(null);
    recordMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen / Modal Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dropIconBox}>
            <Ionicons name="water" size={18} color="#DC2626" />
          </View>
          <Text style={styles.headerTitle}>Record Blood Donation</Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Feather name="x" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Medical & Health Guidance Card */}
        <View style={styles.guidanceCard}>
          <View style={styles.guidanceHeader}>
            <Ionicons name="shield-checkmark" size={17} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.guidanceTitle}>Medical & Health Guidance</Text>
          </View>
          <Text style={styles.guidanceText}>
            Blood donation eligibility depends on your personal health status, hemoglobin level, and medical guidelines prescribed by Narayani Hospital or Red Cross blood donation services. Please consult healthcare professionals at the donation venue.
          </Text>
        </View>

        {/* API Error Notification */}
        {apiError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={17} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        )}

        {/* 2. Donation Date (AD / BS Dual Calendar) */}
        <DualCalendarDatePicker
          value={selectedAdDate}
          onChange={(adDate) => setSelectedAdDate(adDate)}
          label="Donation Date *"
          maxDate={new Date()}
        />

        {/* 3. Donation Location / Hospital */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Donation Location / Hospital *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={19} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={hospitalName}
              onChangeText={setHospitalName}
              placeholder="e.g. Narayani Hospital, Birgunj"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* 4. Associated Campaign (Optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Associated Campaign (Optional)</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowCampaignDropdown(!showCampaignDropdown)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownBtnText} numberOfLines={1}>
              {CAMPAIGN_OPTIONS.find((c) => c.id === selectedCampaign)?.title ||
                '-- Independent Voluntary Donation --'}
            </Text>
            <Ionicons
              name={showCampaignDropdown ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>

          {showCampaignDropdown && (
            <View style={styles.dropdownList}>
              {CAMPAIGN_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dropdownItem,
                    selectedCampaign === item.id && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCampaign(item.id);
                    setShowCampaignDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCampaign === item.id && styles.dropdownItemTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {selectedCampaign === item.id && (
                    <Ionicons name="checkmark" size={16} color="#DC2626" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 5. Upload Donor Photo Card */}
        <View style={styles.photoSectionCard}>
          {/* Card Title Row */}
          <View style={styles.photoHeaderRow}>
            <View style={styles.photoTitleLeft}>
              <Ionicons name="camera-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.photoSectionTitle}>Upload Donor Photo (You Donating Blood)</Text>
            </View>
            <View style={styles.spotlightPill}>
              <Text style={styles.spotlightPillText}>Social Spotlight</Text>
            </View>
          </View>

          <Text style={styles.photoSectionDesc}>
            Upload a picture of you donating blood, at the blood bank bed, or holding your donor certificate. We feature verified donors on our social media to inspire the community.
          </Text>

          {/* Upload Area / Thumbnail Box */}
          {photo ? (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: photo.uri }} style={styles.thumbnailImage} />
              <View style={styles.thumbnailDetails}>
                <View style={styles.attachedPill}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.attachedPillText}>Photo Attached</Text>
                </View>
                <Text style={styles.filenameText} numberOfLines={1}>
                  {photo.name}
                </Text>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={handlePickPhoto}
                  activeOpacity={0.7}
                >
                  <Feather name="refresh-cw" size={13} color="#DC2626" style={{ marginRight: 4 }} />
                  <Text style={styles.retakeBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setPhoto(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadDashedBox}
              onPress={handlePickPhoto}
              activeOpacity={0.75}
            >
              <View style={styles.uploadIconCircle}>
                <Feather name="upload" size={20} color="#DC2626" />
              </View>
              <Text style={styles.uploadPromptTitle}>Upload Your Donation Photo</Text>
              <Text style={styles.uploadPromptSub}>Take a selfie or choose image from gallery</Text>
            </TouchableOpacity>
          )}

          {/* Sample Photos Row */}
          <View style={styles.samplePhotosRow}>
            <Text style={styles.sampleLabel}>Sample Photos:</Text>
            <TouchableOpacity style={styles.sampleChip} activeOpacity={0.8}>
              <MaterialCommunityIcons name="creation" size={13} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.sampleChipText}>Hero Donor (Male)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sampleChip} activeOpacity={0.8}>
              <MaterialCommunityIcons name="creation" size={13} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.sampleChipText}>Hero Donor (Female)</Text>
            </TouchableOpacity>
          </View>

          {/* Social Media Consent Box */}
          <View style={styles.consentCard}>
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setPermissionToPost(!permissionToPost)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, permissionToPost && styles.checkboxChecked]}>
                {permissionToPost && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.consentTitle}>Permission to Post on Social Media</Text>
            </TouchableOpacity>
            <Text style={styles.consentBody}>
              I agree and authorize Blood Sanjal Nepal to share my photo, name, and blood donation recognition on official social media channels (Facebook, Instagram, Twitter) to encourage other citizens to donate blood.
            </Text>
          </View>
        </View>

        {/* 6. Additional Notes / Experience */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Additional Notes / Experience</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Smooth donation experience with Red Cross team in Birgunj."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* 7. Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, recordMutation.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={recordMutation.isPending}
          activeOpacity={0.88}
        >
          {recordMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="water" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Submit Donation Record</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  guidanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  guidanceTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#065F46',
  },
  guidanceText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#166534',
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#DC2626',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  openCalendarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openCalendarBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#DC2626',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#1E293B',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: '#0F172A',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  dropdownBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF2F2',
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#334155',
    flex: 1,
  },
  dropdownItemTextActive: {
    color: '#DC2626',
    fontFamily: fonts.bold,
  },
  photoSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  photoTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  photoSectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#0F172A',
    flex: 1,
  },
  spotlightPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  spotlightPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#DC2626',
  },
  photoSectionDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  uploadDashedBox: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadPromptTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#1E293B',
    marginBottom: 2,
  },
  uploadPromptSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#94A3B8',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  thumbnailDetails: {
    flex: 1,
    marginLeft: 12,
  },
  attachedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  attachedPillText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: '#059669',
  },
  filenameText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginBottom: 4,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#DC2626',
  },
  removePhotoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  samplePhotosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sampleLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#64748B',
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sampleChipText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#334155',
  },
  consentCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  consentTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#1E293B',
  },
  consentBody: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#475569',
    lineHeight: 16,
    marginLeft: 26,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: '#0F172A',
    minHeight: 80,
  },
  submitBtn: {
    backgroundColor: '#DC2626',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: -0.2,
  },
});
