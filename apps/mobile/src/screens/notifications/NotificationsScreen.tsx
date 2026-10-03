import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { NotificationsAPI } from '../../api/notifications.api';
import { colors, spacing } from '../../theme';

export const NotificationsScreen = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      NotificationsAPI.list().then((res) => res.data.data || res.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => NotificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const notifications = Array.isArray(data) ? data : data?.items || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return { name: 'alert-circle', color: '#DC2626', bg: '#FEE2E2' };
      case 'CONTACT_REQUEST':
        return { name: 'person', color: '#2563EB', bg: '#EFF6FF' };
      case 'REWARD':
        return { name: 'trophy', color: '#D97706', bg: '#FEF3C7' };
      case 'CAMPAIGN':
        return { name: 'calendar', color: '#059669', bg: '#ECFDF5' };
      default:
        return { name: 'notifications', color: '#B91C1C', bg: '#FFF1F2' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountPill}>
              <Text style={styles.unreadCountText}>{unreadCount} New</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Ionicons name="checkmark-done" size={14} color="#B91C1C" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Fetching notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>
            You have no notifications at this time. New emergency alerts and donation requests will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#DC2626"
            />
          }
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const iconConfig = getNotificationIcon(item.type);
            const timeStr = new Date(item.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.notificationCard,
                  !item.isRead && styles.unreadCard,
                ]}
                onPress={() => {
                  if (!item.isRead) markAsReadMutation.mutate(item._id);
                }}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: iconConfig.bg },
                  ]}
                >
                  <Ionicons
                    name={iconConfig.name as any}
                    size={20}
                    color={iconConfig.color}
                  />
                </View>

                <View style={styles.contentContainer}>
                  <View style={styles.notifTopRow}>
                    <Text style={styles.typeBadge}>
                      {item.type?.replace(/_/g, ' ') || 'SYSTEM'}
                    </Text>
                    <Text style={styles.time}>{timeStr}</Text>
                  </View>

                  {item.title && (
                    <Text style={[styles.notifTitle, !item.isRead && styles.unreadNotifTitle]}>
                      {item.title}
                    </Text>
                  )}

                  <Text
                    style={[
                      styles.message,
                      !item.isRead && styles.unreadMessage,
                    ]}
                  >
                    {item.message}
                  </Text>
                </View>

                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    color: '#0F172A',
  },
  unreadCountPill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadCountText: {
    fontSize: 11,
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#B91C1C',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FECACA',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  unreadNotifTitle: {
    color: '#B91C1C',
  },
  message: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  unreadMessage: {
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginLeft: 8,
    marginTop: 4,
  },
});

