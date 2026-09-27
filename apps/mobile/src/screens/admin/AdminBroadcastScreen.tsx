import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../../api/admin.api';
import { colors, spacing, typography } from '../../theme';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { InputField } from '../../components/forms/InputField';

export const AdminBroadcastScreen = () => {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [bloodGroup, setBloodGroup] = useState('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: () => AdminAPI.getBroadcasts().then(res => res.data.data || res.data),
  });

  const sendMutation = useMutation({
    mutationFn: (payload: any) => AdminAPI.createBroadcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      setModalVisible(false);
      setTitle('');
      setMessage('');
      Alert.alert("Broadcast Sent", "Targeted notification job has been queued and dispatched.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to dispatch broadcast.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => AdminAPI.cancelBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      Alert.alert("Cancelled", "Scheduled broadcast cancelled.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.message || "Failed to cancel broadcast.");
    }
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Validation", "Please enter broadcast title and message body.");
      return;
    }

    sendMutation.mutate({
      title: title.trim(),
      message: message.trim(),
      targetAudience: bloodGroup === 'ALL' ? 'ALL_DONORS' : `BLOOD_GROUP_${bloodGroup}`,
      bloodGroup: bloodGroup === 'ALL' ? undefined : bloodGroup,
      channels: ['IN_APP', 'PUSH']
    });
  };

  const broadcasts = data?.items || data?.data || (Array.isArray(data) ? data : []);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Emergency & Donor Broadcasts</Text>
        <TouchableOpacity style={styles.composeBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.composeBtnText}>+ New Alert</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : broadcasts.length === 0 ? (
        <Text style={styles.emptyState}>No broadcasts logged. Tap + New Alert to dispatch a message.</Text>
      ) : (
        <FlatList
          data={broadcasts}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.alertTitle}>{item.title || 'Broadcast Alert'}</Text>
                <View style={[styles.badge, item.status === 'SENT' ? styles.badgeSent : styles.badgePending]}>
                  <Text style={[styles.badgeText, item.status === 'SENT' ? styles.textSent : styles.textPending]}>
                    {item.status || 'QUEUED'}
                  </Text>
                </View>
              </View>

              <Text style={styles.alertMessage}>{item.message || item.body}</Text>
              <Text style={styles.targetText}>Audience: {item.targetAudience || 'ALL VOLUNTEERS'}</Text>
              <Text style={styles.dateText}>📅 {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>

              {item.status === 'PENDING' && (
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => cancelMutation.mutate(item._id)}
                  disabled={cancelMutation.isPending}
                >
                  <Text style={styles.cancelBtnText}>Cancel Scheduled Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* Compose Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dispatch Targeted Broadcast</Text>

            <InputField label="Broadcast Title" value={title} onChangeText={setTitle} placeholder="e.g. Urgent O+ Donors Needed in Lalitpur" />
            <InputField label="Notification Message" value={message} onChangeText={setMessage} placeholder="Explain the situation..." multiline />
            <InputField label="Target Blood Group (Optional)" value={bloodGroup} onChangeText={setBloodGroup} placeholder="ALL or e.g. O+, A+, B+" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.dismissBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.dismissBtnText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Dispatch Alert" onPress={handleSend} loading={sendMutation.isPending} />
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
  heading: {
    ...typography.h3,
    color: colors.primaryDark,
    flex: 1,
  },
  composeBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  composeBtnText: {
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
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    ...typography.body1,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeSent: {
    backgroundColor: '#ECFDF5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  textSent: {
    color: '#065F46',
  },
  textPending: {
    color: '#92400E',
  },
  alertMessage: {
    ...typography.body2,
    color: colors.text,
    marginVertical: 4,
  },
  targetText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: spacing.s,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  cancelBtnText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: 'bold',
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
  dismissBtn: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  dismissBtnText: {
    ...typography.button,
    color: colors.textMuted,
  }
});
