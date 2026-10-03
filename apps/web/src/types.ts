export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type DonorStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'active' | 'inactive';
export type RequestStatus = 'PENDING' | 'ACTIVE' | 'FULFILLED' | 'CLOSED' | 'CANCELLED' | 'active' | 'cancelled';
export type RequestUrgency = 'NORMAL' | 'URGENT' | 'CRITICAL' | 'emergency' | 'urgent';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  addressDetail?: string;
  district?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bloodGroup: BloodGroup;
  location?: UserLocation;
  isVerified: boolean;
  avatarUrl?: string;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
  isDonor?: boolean;
  status?: string;
}

export interface DonorProfile {
  userId: string;
  bloodGroup: BloodGroup;
  status?: DonorStatus;
  lastDonationDate?: string;
  totalDonations: number;
  location?: UserLocation;
  donorStatus?: DonorStatus;
  inactiveUntil?: string;
  inactiveReason?: string;
  visibility?: boolean;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  shareContactOnlyAfterAcceptance?: boolean;
  allowEmergencyNotifications?: boolean;
  showApproximateLocation?: boolean;
  reminderDate?: string;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospital: string;
  location: UserLocation;
  hospitalLocation?: UserLocation;
  urgency: RequestUrgency;
  status: RequestStatus;
  isEmergency?: boolean;
  requiredDate?: string;
  description?: string;
  contactName?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt?: string;
  verified?: boolean;
  medicalEvidenceUrl?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | string;
  documentUrl?: string;
  hospitalReportUrl?: string;
  hospitalReportName?: string;
  requesterName?: string;
}

export interface ContactRequest {
  id: string;
  donorId: string;
  requesterId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'accepted' | 'declined' | 'pending';
  createdAt: string;
  donorName?: string;
  requesterName?: string;
  respondedAt?: string;
  bloodRequestId?: string;
  donorContactRevealed?: any;
  bloodGroup?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  date: string;
  location: UserLocation;
  organizer: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
  createdAt?: string;
  rsvpUserIds?: string[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
  data?: any;
}

export interface DonationRecord {
  id: string;
  donorId: string;
  hospital?: string;
  date?: string;
  units?: number;
  status?: 'PENDING' | 'VERIFIED' | string;
  socialPosted?: boolean;
  donorName?: string;
  bloodGroup?: BloodGroup;
  photoUrl?: string;
  socialMediaHandle?: string;
  location?: string;
  donationDate?: string;
  socialStoryMessage?: string;
  allowSocialMediaShare?: boolean;
  campaignId?: string;
  notes?: string;
  verificationStatus?: string;
  verifiedBy?: string;
  createdAt?: string;
}

export interface RewardBadge {
  id: string;
  name?: string;
  description: string;
  icon?: string;
  donorId?: string;
  badgeType?: string;
  title?: string;
  milestoneDonations?: number;
  issuedAt?: string;
}

export interface Certificate {
  id: string;
  donorId: string;
  issueDate?: string;
  issuedDate?: string;
  url?: string;
  donorName?: string;
  certificateType?: string;
  certificateNumber?: string;
  verificationCode?: string;
  donationsCount?: number;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  date: string;
  transactionId?: string;
  userName?: string;
  gateway?: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  allowNewRegistrations?: boolean;
  searchFeeNpr?: number;
  donationEligibilityDays?: number;
  emergencyAutoNotifyRadiusKm?: number;
  paymentGatewayEnabled?: boolean;
}
