import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { DonorsAPI } from '../../api/donors.api';

import { BloodGroupPicker } from '../../components/forms/BloodGroupPicker';
import { InputField } from '../../components/forms/InputField';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { DonorCard } from '../../components/donors/DonorCard';
import { colors, spacing, typography } from '../../theme';

export const FindBloodScreen = () => {
  const navigation = useNavigation<any>();
  const [bloodGroup, setBloodGroup] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);
  
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['donors', 'search', bloodGroup, city],
    queryFn: () => DonorsAPI.search({ bloodGroup, city }).then(res => res.data.data || res.data),
    enabled: false, // only run on manual search
  });

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const handleRequestContact = (donorId: string, donorName: string) => {
    Alert.alert(
      "Request Contact",
      `Are you sure you want to request contact details for ${donorName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            // Note: ContactRequestsAPI is exported from donors.api.ts based on previous setup
            // Usually we'd use a mutation here.
            navigation.navigate('ContactRequests', { donorId });
          }
        }
      ]
    );
  };

  const donors = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Search Donors</Text>
        <BloodGroupPicker selectedValue={bloodGroup} onValueChange={setBloodGroup} />
        
        <InputField 
          label="City / District" 
          placeholder="e.g. Kathmandu" 
          value={city}
          onChangeText={setCity}
        />
        
        <PrimaryButton 
          title="Search" 
          onPress={handleSearch} 
          loading={isFetching}
        />
        <Text style={styles.disclaimer}>
          Donors are verified automatically. Requesting contact requires their consent.
        </Text>
      </View>

      <View style={styles.resultsSection}>
        {isLoading || isFetching ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : hasSearched && donors.length === 0 ? (
          <Text style={styles.emptyState}>No donors found matching your criteria. Try widening your search.</Text>
        ) : (
          <FlatList
            data={donors}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={({ item }) => (
              <DonorCard
                name={item.name || 'Anonymous Donor'}
                bloodGroup={item.bloodGroup || 'Unknown'}
                location={`${item.cityId || ''} ${item.districtId || ''}`.trim() || 'Unknown Location'}
                status={item.status === 'ACTIVE' ? 'Verified' : 'Pending'}
                onRequestContact={() => handleRequestContact(item._id, item.name)}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.m,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s,
  },
  resultsSection: {
    flex: 1,
  },
  listContainer: {
    padding: spacing.l,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.l,
  }
});
