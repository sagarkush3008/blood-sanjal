import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import * as ImagePicker from 'expo-image-picker';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EditProfileScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then(res => res.data.data || res.data),
  });

  const [name, setName] = useState(meData?.name || '');
  const [cityId, setCityId] = useState(meData?.cityId || '');
  const [bloodGroup, setBloodGroup] = useState(meData?.bloodGroup || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(meData?.avatarAssetId || null);
  const [isUploading, setIsUploading] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert("Success", "Profile updated successfully.");
      navigation.navigate('ProfileHome');
    },
    onError: (error: any) => {
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
    }
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      const selectedUri = result.assets[0].uri;
      setAvatarUri(selectedUri);
      uploadImage(selectedUri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      await AuthAPI.uploadAvatar(uri);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert("Success", "Profile picture updated!");
    } catch (error: any) {
      Alert.alert("Error", "Failed to upload image.");
      setAvatarUri(meData?.avatarAssetId || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ name, cityId, bloodGroup });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatar} disabled={isUploading}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{meData?.name?.charAt(0) || 'U'}</Text>
          )}
          {isUploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <Text style={{ fontSize: 16 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.email}>{meData?.email}</Text>
      </View>

      <View style={styles.formContainer}>
        <InputField 
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
        />

        <Text style={styles.label}>Blood Group</Text>
        <View style={styles.bloodGroupGrid}>
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[
                styles.bloodGroupChip,
                bloodGroup === bg && styles.bloodGroupChipSelected
              ]}
              onPress={() => setBloodGroup(bg)}
            >
              <Text style={[
                styles.bloodGroupText,
                bloodGroup === bg && styles.bloodGroupTextSelected
              ]}>
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <InputField 
          label="City / Location"
          value={cityId}
          onChangeText={setCityId}
          placeholder="Kathmandu"
        />

        <View style={styles.spacer} />

        <PrimaryButton 
          title="Save Changes" 
          onPress={handleSave} 
          loading={updateMutation.isPending} 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    ...typography.h1,
    color: colors.surface,
    fontSize: 40,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  email: {
    ...typography.body2,
    color: colors.textMuted,
    marginTop: spacing.m,
  },
  formContainer: {
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    ...typography.subtitle2,
    color: colors.text,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  bloodGroupChip: {
    width: '23%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodGroupChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bloodGroupText: {
    ...typography.subtitle2,
    color: '#64748B',
    fontFamily: 'Inter_700Bold',
  },
  bloodGroupTextSelected: {
    color: '#FFFFFF',
  },
  spacer: {
    height: spacing.xl,
  }
});
