import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { fonts } from '../../theme';

export interface BloodGroupStat {
  bloodGroup: string;
  count: number;
  status: string;
}

export interface BloodGroupsRegisteredGridProps {
  onSelectBloodGroup: (bloodGroup: string) => void;
  stats?: BloodGroupStat[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_STATS: BloodGroupStat[] = [
  { bloodGroup: 'O+', count: 28, status: '+4 This Week' },
  { bloodGroup: 'A+', count: 18, status: '+2 This Week' },
  { bloodGroup: 'B+', count: 22, status: '+3 This Week' },
  { bloodGroup: 'AB+', count: 14, status: 'Stable' },
  { bloodGroup: 'O-', count: 6, status: 'Critical Low' },
  { bloodGroup: 'A-', count: 5, status: 'Critical Low' },
  { bloodGroup: 'B-', count: 4, status: 'Critical Low' },
  { bloodGroup: 'AB-', count: 3, status: 'Critical Low' },
];

export const BloodGroupsRegisteredGrid: React.FC<BloodGroupsRegisteredGridProps> = ({
  onSelectBloodGroup,
  stats = DEFAULT_STATS,
  title = 'Blood Groups Registered',
  subtitle = 'Tap any group to view registered voluntary donors',
}) => {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleColumn}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* 3-Column Uniform Grid */}
      <View style={styles.gridContainer}>
        {stats.map((item) => (
          <Pressable
            key={item.bloodGroup}
            onPress={() => onSelectBloodGroup(item.bloodGroup)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            android_ripple={{ color: '#FEE2E2', borderless: false }}
            accessibilityRole="button"
            accessibilityLabel={`Blood group ${item.bloodGroup}, ${item.count} registered donors`}
          >
            {/* Blood Group Name in Brand Primary Red */}
            <Text style={styles.bloodGroupName}>{item.bloodGroup}</Text>

            {/* Large Bold Count in Dark Charcoal */}
            <Text style={styles.countText}>{item.count}</Text>

            {/* Small Status Text in Soft Gray */}
            <Text style={styles.statusText} numberOfLines={1}>
              {item.status}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  headerTitleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    color: '#64748B',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  card: {
    // 3-column responsive width: 3 cards per row with 12px uniform gaps
    width: '30.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 104,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  bloodGroupName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#DC2626', // Brand primary red
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  countText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: '#111827', // Dark charcoal
    marginVertical: 3,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: '#6B7280', // Soft gray
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
