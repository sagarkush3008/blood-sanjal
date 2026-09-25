import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsAPI } from '../../api/notifications.api';
import { colors, spacing, typography } from '../../theme';

export const NotificationsScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationsAPI.list().then(res => res.data.data || res.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => NotificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    }
  });

  const notifications = Array.isArray(data) ? data : data?.items || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some((n: any) => !n.isRead) && (
          <TouchableOpacity onPress={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyState}>You're all caught up!</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
              onPress={() => {
                if (!item.isRead) markAsReadMutation.mutate(item._id);
              }}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>
                  {item.type === 'EMERGENCY' ? '🚨' : 
                   item.type === 'CONTACT_REQUEST' ? '👤' : 
                   item.type === 'REWARD' ? '🏆' : '🔔'}
                </Text>
              </View>
              <View style={styles.contentContainer}>
                <Text style={[styles.message, !item.isRead && styles.unreadMessage]}>{item.message}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.primaryDark,
  },
  markAllText: {
    ...typography.button,
    color: colors.primary,
  },
  listContainer: {
    padding: spacing.m,
  },
  emptyState: {
    ...typography.body1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#FFF1F3',
    borderColor: '#FCC2CC',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  iconText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    ...typography.body2,
    color: colors.text,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: 'bold',
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.m,
  }
});
