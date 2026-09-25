import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { AuthAPI } from '../../api/auth.api';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { colors, spacing, typography } from '../../theme';
import * as ImagePicker from 'expo-image-picker';

export const EditProfileScreen = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => AuthAPI.getCurrentUser().then(res => res.data.data || res.data),
  });

  const [name, setName] = useState(meData?.name || '');
  const [cityId, setCityId] = useState(meData?.cityId || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: any) => AuthAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert("Success", "Profile updated successfully.");
      navigation.goBack();
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

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      // In a full flow, you would upload to Cloudinary via FilesAPI here
    }
  };

  const handleSave = () => {
    updateMutation.mutate({ name, cityId });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.avatar}>
          <Text style={styles.avatarText}>{meData?.name?.charAt(0) || 'U'}</Text>
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
  },
  spacer: {
    height: spacing.xl,
  }
});
