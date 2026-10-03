import { BloodGroup, DonorStatus, RequestStatus, RequestUrgency, UserLocation } from '../../types';

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
  entityType: 'donor' | 'request';
  entityId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string; // 'system', 'admin_id', 'user_id'
  reason?: string;
  timestamp: string;
  entityName?: string;
}

export interface ActiveStatusSummary {
  serverUptimeSeconds: number;
  onlineDonorsCount: number;
  activeDonorsCount: number;
  activeRequestsCount: number;
  urgentRequestsCount: number;
  lastUpdatedAt: string;
  totalDonors?: number;
  inactiveDonorsCount?: number;
  totalActiveRequestsCount?: number;
  activeEmergencyRequestsCount?: number;
  bloodGroupBreakdown?: Record<string, number>;
}

export interface UpdateDonorStatusPayload {
  status: DonorStatus;
  visibility?: boolean;
  inactiveUntil?: string;
  inactiveReason?: string;
}

export interface HeartbeatPayload {
  clientTime: string;
  platform?: string;
  currentRoute?: string;
}
