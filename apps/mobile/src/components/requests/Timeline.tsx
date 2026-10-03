import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export interface TimelineEvent {
  title: string;
  description?: string;
  timestamp?: string | Date;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING';
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isDone = event.status === 'COMPLETED';
        const isCurrent = event.status === 'CURRENT';

        const dotColor = isDone
          ? '#10B981'
          : isCurrent
          ? colors.primary
          : '#CBD5E1';

        const iconName = isDone
          ? 'checkmark-circle'
          : isCurrent
          ? 'radio-button-on'
          : 'ellipse-outline';

        const formattedTime = event.timestamp
          ? new Date(event.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

        return (
          <View key={index} style={styles.eventRow}>
            {/* Left Axis: Dot and connecting vertical line */}
            <View style={styles.axisCol}>
              <Ionicons name={iconName as any} size={20} color={dotColor} />
              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    { backgroundColor: isDone ? '#A7F3D0' : '#E2E8F0' },
                  ]}
                />
              )}
            </View>

            {/* Right Content */}
            <View style={[styles.contentCol, !isLast && { paddingBottom: 22 }]}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.eventTitle,
                    isCurrent && { color: colors.primary, fontFamily: 'Inter_700Bold' },
                  ]}
                >
                  {event.title}
                </Text>
                {formattedTime ? (
                  <Text style={styles.timestampText}>{formattedTime}</Text>
                ) : null}
              </View>

              {event.description ? (
                <Text style={styles.eventDescription}>{event.description}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  eventRow: {
    flexDirection: 'row',
  },
  axisCol: {
    alignItems: 'center',
    width: 28,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  eventTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  eventDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});
