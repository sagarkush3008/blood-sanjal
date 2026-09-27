import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { InputField } from '../../components/forms/InputField';

export const AdminCampaignsScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('Nepal Red Cross Society');
  const [location, setLocation] = useState('Kathmandu');
  const [description, setDescription] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => AdminAPI.getCampaigns().then(res => res.data.data || res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newCamp: any) => AdminAPI.createCampaign(newCamp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setModalVisible(false);
      setTitle('');
      setDescription('');
      Alert.alert("Success", "Blood drive campaign published successfully.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to create campaign.");
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => AdminAPI.updateCampaignStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      Alert.alert("Success", "Campaign status updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to update campaign status.");
    }
  });

  const handleCreate = () => {
    if (!title.trim() || !location.trim()) {
      Alert.alert("Validation", "Please enter campaign title and venue location.");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      organizer: organizer.trim(),
      location: location.trim(),
      description: description.trim() || 'Community blood drive to support local health facilities.',
      date: new Date(Date.now() + 7 * 86400000).toISOString(),
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      bloodGroupsNeeded: ['A+', 'B+', 'AB+', 'O+'],
      status: 'PUBLISHED'
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    Alert.alert(
      "Update Status",
      `Set campaign status to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => statusMutation.mutate({ id, status: newStatus }) }
      ]
    );
  };

  const campaigns = data?.items || data?.data || data?.campaigns || (Array.isArray(data) ? data : []);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.screenHeading}>Blood Drives & Camps</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.newButtonText}>+ Create Drive</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : campaigns.length === 0 ? (
        <Text style={styles.emptyState}>No campaigns found. Tap + Create Drive to publish one.</Text>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.campaignTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, item.status === 'PUBLISHED' ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.statusBadgeText, item.status === 'PUBLISHED' ? styles.textActive : styles.textInactive]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.organizerText}>🏢 {item.organizer || 'Blood Sanjal Central'}</Text>
              <Text style={styles.locationText}>📍 {item.location || 'Kathmandu'}</Text>
              <Text style={styles.dateText}>📅 {item.date ? new Date(item.date).toLocaleDateString() : 'Upcoming'}</Text>

              <View style={styles.actionRow}>
                {item.status !== 'PUBLISHED' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.publishBtn]} onPress={() => handleStatusChange(item._id, 'PUBLISHED')}>
                    <Text style={styles.actionBtnText}>Publish</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'PUBLISHED' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleStatusChange(item._id, 'COMPLETED')}>
                    <Text style={styles.actionBtnText}>Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, styles.archiveBtn]} onPress={() => handleStatusChange(item._id, 'ARCHIVED')}>
                  <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Archive</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal for Creating Campaign */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Blood Donation Camp</Text>
            
            <InputField label="Drive Title" value={title} onChangeText={setTitle} placeholder="e.g. Youth Blood Drive 2026" />
            <InputField label="Organizer Organization" value={organizer} onChangeText={setOrganizer} />
            <InputField label="Venue / Location" value={location} onChangeText={setLocation} placeholder="e.g. City Hall, Pokhara" />
            <InputField label="Description" value={description} onChangeText={setDescription} placeholder="Drive details..." />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Publish Drive" onPress={handleCreate} loading={createMutation.isPending} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenHeading: {
    ...typography.h3,
    color: colors.primaryDark,
  },
  newButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  newButtonText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.surface,
  },
  listContainer: {
    padding: spacing.m,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  campaignTitle: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: spacing.s,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textActive: {
    color: '#065F46',
  },
  textInactive: {
    color: '#6B7280',
  },
  organizerText: {
    ...typography.caption,
    color: colors.text,
    marginBottom: 2,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.s,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  publishBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  completeBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  archiveBtn: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.m,
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: 16,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.primaryDark,
    marginBottom: spacing.m,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  cancelBtn: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.textMuted,
  }
});
