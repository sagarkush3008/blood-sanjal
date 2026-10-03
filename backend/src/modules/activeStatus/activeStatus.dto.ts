export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type DonorStatus = 'ACTIVE' | 'INACTIVE';
export type RequestStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'FULFILLED' | 'CLOSED' | 'CANCELLED';
export type RequestUrgency = 'NORMAL' | 'URGENT' | 'EMERGENCY';

export interface UserLocation {
  provinceId: string;
  districtId: string;
  cityId: string;
  lon?: number;
  lat?: number;
}

export interface DonorActiveStatusRecord {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  bloodGroup: BloodGroup;
  location: UserLocation;
  donorStatus: DonorStatus;
  isOnline: boolean;
  lastHeartbeat: string;
  visibility: boolean;
  inactiveUntil?: string;
  inactiveReason?: string;
  totalDonations: number;
  lastDonationDate?: string;
  updatedAt: string;
}

export interface ActiveBloodRequestRecord {
  id: string;
  requesterId: string;
  requesterName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospital: string;
  hospitalLocation: UserLocation;
  urgency: RequestUrgency;
  status: RequestStatus;
  isEmergency: boolean;
  requiredDate: string;
  requiredTime: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusAuditEntry {
  id: string;
  entityType: 'donor' | 'blood_request';
  entityId: string;
  entityName: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: string;
  timestamp: string;
}

export interface ActiveStatusSummary {
  totalDonors: number;
  activeDonorsCount: number;
  onlineDonorsCount: number;
  inactiveDonorsCount: number;
  recentlyDonatedCount: number;
  busyDonorsCount: number;
  activeEmergencyRequestsCount: number;
  activeUrgentRequestsCount: number;
  totalActiveRequestsCount: number;
  bloodGroupBreakdown: Record<
    BloodGroup,
    {
      total: number;
      active: number;
      online: number;
    }
  >;
  serverUptimeSeconds: number;
  lastSyncedAt: string;
}

export interface UpdateDonorStatusPayload {
  status: DonorStatus;
  inactiveHours?: number;
  inactiveDays?: number;
  inactiveUntil?: string;
  inactiveReason?: string;
  visibility?: boolean;
  changedBy?: string;
}

export interface HeartbeatPayload {
  userId: string;
  clientTime?: string;
  platform?: string;
  currentRoute?: string;
}
