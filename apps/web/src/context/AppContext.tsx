import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  DonorProfile,
  BloodRequest,
  ContactRequest,
  Campaign,
  NotificationItem,
  DonationRecord,
  RewardBadge,
  Certificate,
  PaymentRecord,
  SystemSettings,
  BloodGroup,
  RequestUrgency,
  DonorStatus
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  INITIAL_CAMPAIGNS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DONATIONS,
  INITIAL_REWARDS,
  INITIAL_CERTIFICATES,
  INITIAL_PAYMENTS
} from '../constants/demoSeedData';
import { MockPaymentService, PaymentRequest } from '../services/mockPaymentService';
import { Language, Translations, TRANSLATIONS } from '../i18n/translations';
import { tr as trHelper } from '../i18n/nepaliDictionary';
import { activeStatusApi } from '../services/activeStatusApi';
import { ActiveStatusSummary } from '../server/types/activeStatus';

interface AppContextType {
  currentUser: UserProfile | null;
  currentDonorProfile: DonorProfile | null;
  allUsers: UserProfile[];
  donors: DonorProfile[];
  bloodRequests: BloodRequest[];
  contactRequests: ContactRequest[];
  campaigns: Campaign[];
  notifications: NotificationItem[];
  donations: DonationRecord[];
  rewards: RewardBadge[];
  certificates: Certificate[];
  payments: PaymentRecord[];
  settings: SystemSettings;
  unreadNotifCount: number;

  // Language & i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, fallback?: string) => string;
  tr: (text: string | null | undefined) => string;

  // Actions
  switchPersona: (roleOrUserId: string) => void;
  updateUserProfile: (updated: Partial<UserProfile>) => void;
  updateDonorProfile: (updated: Partial<DonorProfile>) => void;
  registerUser: (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, donorData?: Partial<DonorProfile>) => Promise<UserProfile>;
  loginUser: (email: string) => Promise<UserProfile>;
  logoutUser: () => void;

  // Blood Request Actions
  createBloodRequest: (data: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus' | 'status'>) => Promise<BloodRequest>;
  verifyBloodRequest: (requestId: string, approved: boolean) => void;
  updateRequestStatus: (requestId: string, status: BloodRequest['status']) => void;
  attachReportToRequest: (requestId: string, reportUrl: string, reportName?: string) => void;

  // Contact Request Actions
  requestDonorContact: (donorId: string, bloodRequestId?: string) => Promise<ContactRequest>;
  respondContactRequest: (contactRequestId: string, accept: boolean) => void;

  // Donation Actions
  recordDonation: (data: {
    donationDate: string;
    location: string;
    campaignId?: string;
    photoUrl?: string;
    allowSocialMediaShare?: boolean;
    socialMediaHandle?: string;
    socialStoryMessage?: string;
    notes?: string;
  }) => Promise<DonationRecord>;
  verifyDonation: (donationId: string, approved: boolean) => void;
  toggleDonationSocialPosted: (donationId: string) => void;

  // Campaign Actions
  createCampaign: (data: Omit<Campaign, 'id' | 'createdAt'>) => void;
  toggleCampaignRsvp: (campaignId: string) => void;

  // Notification Actions
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  sendBroadcastNotification: (data: { title: string; message: string; type: NotificationItem['type']; targetUserId?: string }) => void;

  // Payment Actions
  processMaintenanceFeePayment: (req: Omit<PaymentRequest, 'userId' | 'userName'>) => Promise<PaymentRecord>;

  // Admin Actions
  verifyUser: (userId: string, status: UserProfile['status']) => void;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => void;
  issueCertificate: (donorId: string, type: Certificate['certificateType']) => void;

  // Search Flow Fee Passed State
  hasPaidSearchFee: boolean;
  setHasPaidSearchFee: (paid: boolean) => void;

  // Active Status Feature State & Actions
  activeStatusSummary: ActiveStatusSummary | null;
  refreshActiveStatusSummary: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('bs_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('bs_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [donors, setDonors] = useState<DonorProfile[]>(() => {
    const saved = localStorage.getItem('bs_donors');
    return saved ? JSON.parse(saved) : INITIAL_DONORS;
  });

  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem('bs_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [contactRequests, setContactRequests] = useState<ContactRequest[]>(() => {
    const saved = localStorage.getItem('bs_contact_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('bs_campaigns');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('bs_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [donations, setDonations] = useState<DonationRecord[]>(() => {
    const saved = localStorage.getItem('bs_donations');
    return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
  });

  const [rewards, setRewards] = useState<RewardBadge[]>(() => {
    const saved = localStorage.getItem('bs_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('bs_certificates');
    return saved ? JSON.parse(saved) : INITIAL_CERTIFICATES;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('bs_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [settings, setSettings] = useState<SystemSettings>({
    searchFeeNpr: 15,
    donationEligibilityDays: 90,
    emergencyAutoNotifyRadiusKm: 15,
    maintenanceMode: false,
    paymentGatewayEnabled: true
  });

  const [hasPaidSearchFee, setHasPaidSearchFee] = useState<boolean>(false);
  const [activeStatusSummary, setActiveStatusSummary] = useState<ActiveStatusSummary | null>(null);

  const refreshActiveStatusSummary = async () => {
    try {
      const summary = await activeStatusApi.getSummary();
      setActiveStatusSummary(summary);
    } catch {
      // Backend may be starting
    }
  };

  // Language state with persistence
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('bs_language');
      return saved === 'ne' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('bs_language', lang);
    } catch (e) {
      // ignore
    }
  };

  const t = (key: keyof Translations, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || fallback || (key as string);
  };

  const tr = (text: string | null | undefined): string => {
    return (trHelper(text, language) as string) || '';
  };

  // Sync state to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('bs_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bs_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bs_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('bs_donors', JSON.stringify(donors));
  }, [donors]);

  useEffect(() => {
    localStorage.setItem('bs_requests', JSON.stringify(bloodRequests));
  }, [bloodRequests]);

  useEffect(() => {
    localStorage.setItem('bs_contact_requests', JSON.stringify(contactRequests));
  }, [contactRequests]);

  useEffect(() => {
    localStorage.setItem('bs_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('bs_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('bs_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem('bs_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem('bs_certificates', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('bs_payments', JSON.stringify(payments));
  }, [payments]);

  // --- Active Status Feature: Heartbeat, Auto-Expiration & Live Stream ---
  useEffect(() => {
    refreshActiveStatusSummary();

    const unsubscribe = activeStatusApi.subscribeToLiveStream((eventData) => {
      if (eventData.type === 'initial_state') {
        if (eventData.summary) setActiveStatusSummary(eventData.summary);
      } else if (eventData.event === 'donors_auto_restored') {
        const restored = eventData.payload?.restoredDonors || [];
        if (restored.length > 0) {
          setDonors((prev) =>
            prev.map((d) => {
              const hit = restored.find((r: any) => r.userId === d.userId);
              return hit
                ? {
                    ...d,
                    donorStatus: 'active' as DonorStatus,
                    visibility: true,
                    inactiveUntil: undefined,
                    inactiveReason: undefined
                  }
                : d;
            })
          );
        }
      } else if (eventData.event === 'donor_status_changed') {
        const changed = eventData.payload?.donor;
        if (changed) {
          setDonors((prev) =>
            prev.map((d) =>
              d.userId === changed.userId
                ? {
                    ...d,
                    donorStatus: changed.donorStatus,
                    visibility: changed.visibility,
                    inactiveUntil: changed.inactiveUntil,
                    inactiveReason: changed.inactiveReason
                  }
                : d
            )
          );
        }
        if (eventData.payload?.summary) {
          setActiveStatusSummary(eventData.payload.summary);
        }
      } else if (eventData.event === 'new_active_request' || eventData.event === 'request_status_changed') {
        if (eventData.payload?.summary) {
          setActiveStatusSummary(eventData.payload.summary);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Heartbeat ping every 30s when user is active
  useEffect(() => {
    if (!currentUser) return;

    activeStatusApi.sendHeartbeat(currentUser.id).catch(() => {});

    const interval = setInterval(() => {
      activeStatusApi.sendHeartbeat(currentUser.id).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Periodic client-side check to restore expired snoozed donors
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setDonors((prev) => {
        let changed = false;
        const next = prev.map((d) => {
          if (
            d.donorStatus === 'inactive' &&
            d.inactiveUntil &&
            new Date(d.inactiveUntil).getTime() <= now
          ) {
            changed = true;
            return {
              ...d,
              donorStatus: 'active' as DonorStatus,
              visibility: true,
              inactiveUntil: undefined,
              inactiveReason: undefined
            };
          }
          return d;
        });
        return changed ? next : prev;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Derive current donor profile
  const currentDonorProfile = currentUser
    ? donors.find((d) => d.userId === currentUser.id) || null
    : null;

  // Unread notifications
  const unreadNotifCount = currentUser
    ? notifications.filter((n) => (n.userId === currentUser.id || n.userId === 'all') && !n.read).length
    : 0;

  // Switch persona (for quick dev testing)
  const switchPersona = (roleOrUserId: string) => {
    if (roleOrUserId === 'admin') {
      const admin = allUsers.find((u) => u.role === 'admin') || INITIAL_USERS[5];
      setCurrentUser(admin);
    } else {
      const found = allUsers.find((u) => u.id === roleOrUserId || u.role === roleOrUserId);
      if (found) setCurrentUser(found);
    }
  };

  const updateUserProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updated, updatedAt: new Date().toISOString() };
    setCurrentUser(newProfile);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? newProfile : u)));
  };

  const updateDonorProfile = (updated: Partial<DonorProfile>) => {
    if (!currentUser) return;
    setDonors((prev) => {
      const exists = prev.some((d) => d.userId === currentUser.id);
      if (exists) {
        return prev.map((d) => (d.userId === currentUser.id ? { ...d, ...updated } : d));
      } else {
        const newDonor: DonorProfile = {
          userId: currentUser.id,
          userName: currentUser.name,
          userPhone: currentUser.phone,
          userEmail: currentUser.email,
          bloodGroup: currentUser.bloodGroup,
          location: currentUser.location,
          totalDonations: 0,
          donorStatus: 'active',
          visibility: true,
          shareContactOnlyAfterAcceptance: true,
          allowEmergencyNotifications: true,
          showApproximateLocation: true,
          ...updated
        };
        return [...prev, newDonor];
      }
    });

    // Sync to backend active status feature API
    if (updated.donorStatus) {
      activeStatusApi
        .updateDonorStatus(currentUser.id, {
          status: updated.donorStatus,
          inactiveUntil: updated.inactiveUntil,
          inactiveReason: updated.inactiveReason,
          visibility: updated.visibility,
          changedBy: currentUser.name
        })
        .catch((err) => console.warn('[ActiveStatus Sync]', err));
    }
  };

  const registerUser = async (
    userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>,
    donorData?: Partial<DonorProfile>
  ): Promise<UserProfile> => {
    const newId = 'user_' + Date.now();
    const newUser: UserProfile = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    if (userData.isDonor) {
      const newDonor: DonorProfile = {
        userId: newId,
        userName: newUser.name,
        userPhone: newUser.phone,
        userEmail: newUser.email,
        bloodGroup: newUser.bloodGroup,
        location: newUser.location,
        totalDonations: donorData?.lastDonationDate ? 1 : 0,
        donorStatus: 'active',
        visibility: donorData?.visibility ?? true,
        shareContactOnlyAfterAcceptance: donorData?.shareContactOnlyAfterAcceptance ?? true,
        allowEmergencyNotifications: donorData?.allowEmergencyNotifications ?? true,
        showApproximateLocation: donorData?.showApproximateLocation ?? true,
        lastDonationDate: donorData?.lastDonationDate,
        reminderDate: donorData?.lastDonationDate
          ? new Date(new Date(donorData.lastDonationDate).getTime() + 90 * 86400000).toISOString().split('T')[0]
          : undefined
      };
      setDonors((prev) => [...prev, newDonor]);
    }

    return newUser;
  };

  const loginUser = async (emailOrPhone: string): Promise<UserProfile> => {
    const found = allUsers.find(
      (u) => u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone
    );
    if (found) {
      setCurrentUser(found);
      return found;
    }
    throw new Error('User not found. Please check your credentials or register.');
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  // Create Blood Request
  const createBloodRequest = async (
    data: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus' | 'status'>
  ): Promise<BloodRequest> => {
    const isEmergency = data.urgency === 'emergency';
    const newRequest: BloodRequest = {
      ...data,
      id: 'req_' + Date.now(),
      verificationStatus: isEmergency ? 'pending' : 'verified', // Emergency needs admin verification
      status: 'active',
      isEmergency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBloodRequests((prev) => [newRequest, ...prev]);

    // Send emergency broadcast notification to relevant donors if verified/auto-notified
    if (!isEmergency) {
      // Notify matching blood group donors
      const matchingDonors = donors.filter(
        (d) => d.bloodGroup === data.bloodGroup && d.allowEmergencyNotifications && d.userId !== data.requesterId
      );
      const newNotifs: NotificationItem[] = matchingDonors.map((d) => ({
        id: 'notif_' + Math.random().toString(36).substr(2, 9),
        userId: d.userId,
        type: 'blood_request',
        title: `🩸 ${data.bloodGroup} Blood Required in ${data.hospitalLocation.city}`,
        message: `${data.unitsRequired} Units needed at ${data.hospital}. Tap to view and respond.`,
        read: false,
        createdAt: new Date().toISOString(),
        data: { requestId: newRequest.id, urgency: data.urgency }
      }));
      setNotifications((prev) => [...newNotifs, ...prev]);
    }

    return newRequest;
  };

  const verifyBloodRequest = (requestId: string, approved: boolean) => {
    // Sync to backend active status feature API
    activeStatusApi
      .updateRequestStatus(
        requestId,
        approved ? 'active' : 'cancelled',
        currentUser?.name || 'Admin',
        approved ? 'Admin approved emergency verification' : 'Admin rejected request'
      )
      .catch((err) => console.warn('[ActiveStatus Request Sync]', err));

    setBloodRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedStatus: BloodRequest = {
          ...req,
          verificationStatus: approved ? 'verified' : 'rejected',
          status: approved ? 'active' : 'cancelled',
          updatedAt: new Date().toISOString()
        };

        // If emergency request approved, broadcast to donors
        if (approved && req.isEmergency) {
          const matchingDonors = donors.filter(
            (d) => d.bloodGroup === req.bloodGroup && d.allowEmergencyNotifications && d.userId !== req.requesterId
          );
          const emergencyNotifs: NotificationItem[] = matchingDonors.map((d) => ({
            id: 'notif_emerg_' + Math.random().toString(36).substr(2, 9),
            userId: d.userId,
            type: 'emergency',
            title: `🚨 EMERGENCY: ${req.bloodGroup} Blood Urgently Needed!`,
            message: `CRITICAL: ${req.unitsRequired} units needed at ${req.hospital}, ${req.hospitalLocation.city}. Contact person: ${req.contactPerson}.`,
            read: false,
            createdAt: new Date().toISOString(),
            data: { requestId: req.id, urgency: 'emergency' }
          }));
          setNotifications((n) => [...emergencyNotifs, ...n]);
        }

        return updatedStatus;
      })
    );
  };

  const updateRequestStatus = (requestId: string, status: BloodRequest['status']) => {
    activeStatusApi
      .updateRequestStatus(requestId, status, currentUser?.name || 'User')
      .catch((err) => console.warn('[ActiveStatus Request Sync]', err));

    setBloodRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status, updatedAt: new Date().toISOString() } : req))
    );
  };

  const attachReportToRequest = (requestId: string, reportUrl: string, reportName?: string) => {
    setBloodRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              hospitalReportUrl: reportUrl,
              hospitalReportName: reportName || 'Hospital_Doctor_Blood_Slip.jpg',
              documentUrl: reportUrl,
              updatedAt: new Date().toISOString()
            }
          : req
      )
    );
  };

  // Contact Donor Request
  const requestDonorContact = async (donorId: string, bloodRequestId?: string): Promise<ContactRequest> => {
    if (!currentUser) throw new Error('Must be logged in to request contact.');
    const donor = donors.find((d) => d.userId === donorId);
    if (!donor) throw new Error('Donor not found.');

    const newContactReq: ContactRequest = {
      id: 'cnt_' + Date.now(),
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      donorId: donor.userId,
      donorName: donor.userName,
      bloodRequestId,
      bloodGroup: donor.bloodGroup,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setContactRequests((prev) => [newContactReq, ...prev]);

    // Send notification to donor
    const notif: NotificationItem = {
      id: 'notif_cnt_' + Date.now(),
      userId: donor.userId,
      type: 'contact_request',
      title: '📞 Blood Request Contact Inquiry',
      message: `${currentUser.name} is seeking ${donor.bloodGroup} blood and requested your contact details. Tap to Accept or Decline.`,
      read: false,
      createdAt: new Date().toISOString(),
      data: { contactRequestId: newContactReq.id }
    };

    setNotifications((prev) => [notif, ...prev]);
    return newContactReq;
  };

  const respondContactRequest = (contactRequestId: string, accept: boolean) => {
    setContactRequests((prev) =>
      prev.map((cr) => {
        if (cr.id !== contactRequestId) return cr;
        const donor = donors.find((d) => d.userId === cr.donorId);
        const updated: ContactRequest = {
          ...cr,
          status: accept ? 'accepted' : 'declined',
          respondedAt: new Date().toISOString(),
          donorContactRevealed: accept && donor
            ? {
                phone: donor.userPhone,
                email: donor.userEmail,
                whatsapp: donor.userPhone
              }
            : undefined
        };

        // Notify requester
        const notif: NotificationItem = {
          id: 'notif_cnt_res_' + Date.now(),
          userId: cr.requesterId,
          type: 'contact_request',
          title: accept ? '✅ Donor Contact Request Accepted!' : '❌ Contact Request Declined',
          message: accept
            ? `${cr.donorName} accepted your request! Phone: ${donor?.userPhone || 'N/A'}. Tap to call.`
            : `${cr.donorName} is currently unavailable for donation.`,
          read: false,
          createdAt: new Date().toISOString(),
          data: { contactRequestId: cr.id }
        };

        setNotifications((n) => [notif, ...n]);
        return updated;
      })
    );
  };

  // Record Donation ("I Donated Blood")
  const recordDonation = async (data: {
    donationDate: string;
    location: string;
    campaignId?: string;
    photoUrl?: string;
    allowSocialMediaShare?: boolean;
    socialMediaHandle?: string;
    socialStoryMessage?: string;
    notes?: string;
  }): Promise<DonationRecord> => {
    if (!currentUser) throw new Error('User must be logged in');

    const newRecord: DonationRecord = {
      id: 'don_' + Date.now(),
      donorId: currentUser.id,
      donorName: currentUser.name,
      bloodGroup: currentUser.bloodGroup,
      donationDate: data.donationDate,
      location: data.location,
      campaignId: data.campaignId,
      photoUrl: data.photoUrl,
      allowSocialMediaShare: data.allowSocialMediaShare,
      socialMediaHandle: data.socialMediaHandle,
      socialStoryMessage: data.socialStoryMessage,
      socialPosted: false,
      notes: data.notes,
      verificationStatus: 'verified',
      verifiedBy: 'Blood Sanjal Automated System',
      createdAt: new Date().toISOString()
    };

    setDonations((prev) => [newRecord, ...prev]);

    // Update Donor Profile total donations & last donation date
    setDonors((prev) =>
      prev.map((d) => {
        if (d.userId !== currentUser.id) return d;
        const newTotal = (d.totalDonations || 0) + 1;
        const nextEligibility = new Date(new Date(data.donationDate).getTime() + 90 * 86400000)
          .toISOString()
          .split('T')[0];

        // Milestone badge check
        if (newTotal === 1 || newTotal === 4 || newTotal === 10) {
          const badgeType =
            newTotal === 1 ? 'first_saver' : newTotal === 4 ? 'blood_hero' : 'active_life_saver';
          const title =
            newTotal === 1 ? 'First Saver' : newTotal === 4 ? 'Blood Hero' : 'Active Life Saver';
          const newBadge: RewardBadge = {
            id: 'badge_' + Date.now(),
            donorId: currentUser.id,
            badgeType,
            title,
            description: `Awarded for achieving ${newTotal} voluntary blood donations.`,
            milestoneDonations: newTotal,
            issuedAt: new Date().toISOString()
          };
          setRewards((r) => [newBadge, ...r]);

          // Create Certificate
          const newCert: Certificate = {
            id: 'cert_' + Math.floor(1000 + Math.random() * 9000),
            donorId: currentUser.id,
            donorName: currentUser.name,
            certificateType: 'Life Saver Certificate',
            certificateNumber: `BS-2026-NEPAL-${Math.floor(1000 + Math.random() * 9000)}`,
            issuedDate: data.donationDate,
            verificationCode: `VER-${Math.floor(1000 + Math.random() * 9000)}-BS`,
            donationsCount: newTotal
          };
          setCertificates((c) => [newCert, ...c]);
        }

        return {
          ...d,
          totalDonations: newTotal,
          lastDonationDate: data.donationDate,
          reminderDate: nextEligibility,
          donorStatus: 'recently_donated' as DonorStatus
        };
      })
    );

    return newRecord;
  };

  const verifyDonation = (donationId: string, approved: boolean) => {
    setDonations((prev) =>
      prev.map((don) =>
        don.id === donationId
          ? { ...don, verificationStatus: approved ? 'verified' : 'rejected' }
          : don
      )
    );
  };

  const toggleDonationSocialPosted = (donationId: string) => {
    setDonations((prev) =>
      prev.map((don) =>
        don.id === donationId ? { ...don, socialPosted: !don.socialPosted } : don
      )
    );
  };

  // Campaign Actions
  const createCampaign = (data: Omit<Campaign, 'id' | 'createdAt'>) => {
    const newCamp: Campaign = {
      ...data,
      id: 'camp_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setCampaigns((prev) => [newCamp, ...prev]);

    // Broadcast campaign notification to all users
    const broadcastNotif: NotificationItem = {
      id: 'notif_camp_' + Date.now(),
      userId: 'all',
      type: 'blood_camp',
      title: `⛺ Upcoming Blood Camp: ${data.title}`,
      message: `Join the blood drive on ${data.date} at ${data.location.addressDetail}, ${data.location.city}.`,
      read: false,
      createdAt: new Date().toISOString(),
      data: { campaignId: newCamp.id }
    };
    setNotifications((prev) => [broadcastNotif, ...prev]);
  };

  const toggleCampaignRsvp = (campaignId: string) => {
    if (!currentUser) return;
    setCampaigns((prev) =>
      prev.map((camp) => {
        if (camp.id !== campaignId) return camp;
        const currentRsvps = camp.rsvpUserIds || [];
        const exists = currentRsvps.includes(currentUser.id);
        const updatedRsvps = exists
          ? currentRsvps.filter((id) => id !== currentUser.id)
          : [...currentRsvps, currentUser.id];
        return { ...camp, rsvpUserIds: updatedRsvps };
      })
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) =>
        n.userId === currentUser.id || n.userId === 'all' ? { ...n, read: true } : n
      )
    );
  };

  const sendBroadcastNotification = (data: {
    title: string;
    message: string;
    type: NotificationItem['type'];
    targetUserId?: string;
  }) => {
    const newNotif: NotificationItem = {
      id: 'notif_bcast_' + Date.now(),
      userId: data.targetUserId || 'all',
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Payment Processing
  const processMaintenanceFeePayment = async (
    req: Omit<PaymentRequest, 'userId' | 'userName'>
  ): Promise<PaymentRecord> => {
    if (!currentUser) throw new Error('User not authenticated');
    const record = await MockPaymentService.processPayment({
      ...req,
      userId: currentUser.id,
      userName: currentUser.name
    });

    setPayments((prev) => [record, ...prev]);
    if (record.status === 'completed') {
      setHasPaidSearchFee(true);
    }
    return record;
  };

  // Admin Actions
  const verifyUser = (userId: string, status: UserProfile['status']) => {
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const issueCertificate = (donorId: string, type: Certificate['certificateType']) => {
    const donor = donors.find((d) => d.userId === donorId);
    if (!donor) return;

    const newCert: Certificate = {
      id: 'cert_' + Math.floor(1000 + Math.random() * 9000),
      donorId,
      donorName: donor.userName,
      certificateType: type,
      certificateNumber: `BS-2026-ADMIN-${Math.floor(1000 + Math.random() * 9000)}`,
      issuedDate: new Date().toISOString().split('T')[0],
      verificationCode: `VER-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      donationsCount: donor.totalDonations
    };

    setCertificates((prev) => [newCert, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentDonorProfile,
        allUsers,
        donors,
        bloodRequests,
        contactRequests,
        campaigns,
        notifications,
        donations,
        rewards,
        certificates,
        payments,
        settings,
        unreadNotifCount,

        language,
        setLanguage,
        t,
        tr,

        switchPersona,
        updateUserProfile,
        updateDonorProfile,
        registerUser,
        loginUser,
        logoutUser,

        createBloodRequest,
        verifyBloodRequest,
        updateRequestStatus,
        attachReportToRequest,

        requestDonorContact,
        respondContactRequest,

        recordDonation,
        verifyDonation,
        toggleDonationSocialPosted,

        createCampaign,
        toggleCampaignRsvp,

        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendBroadcastNotification,

        processMaintenanceFeePayment,

        verifyUser,
        updateSystemSettings,
        issueCertificate,

        hasPaidSearchFee,
        setHasPaidSearchFee,

        activeStatusSummary,
        refreshActiveStatusSummary
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
