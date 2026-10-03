import { Response } from 'express';
import {
  BloodGroup,
  DonorStatus,
  RequestStatus,
  RequestUrgency,
  DonorActiveStatusRecord,
  ActiveBloodRequestRecord,
  StatusAuditEntry,
  ActiveStatusSummary,
  UpdateDonorStatusPayload,
  HeartbeatPayload
} from './activeStatus.dto';

const ONLINE_HEARTBEAT_THRESHOLD_MS = 90 * 1000; // 90 seconds

class ActiveStatusService {
  private donors: Map<string, DonorActiveStatusRecord> = new Map();
  private requests: Map<string, ActiveBloodRequestRecord> = new Map();
  private auditLogs: StatusAuditEntry[] = [];
  private sseClients: Set<Response> = new Set();
  private expirationTimer: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor() {
    this.seedInitialData();
    this.startAutoExpirationWorker();
  }

  private seedInitialData() {
    const nowIso = new Date().toISOString();

    const initialDonors: DonorActiveStatusRecord[] = [
      {
        userId: 'user_1',
        userName: 'Aarav Sharma',
        userPhone: '9804512345',
        userEmail: 'aarav.sharma@example.com',
        bloodGroup: 'B+',
        location: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        donorStatus: 'ACTIVE',
        isOnline: true,
        lastHeartbeat: new Date(Date.now() - 10000).toISOString(),
        visibility: true,
        totalDonations: 4,
        lastDonationDate: '2025-11-20',
        updatedAt: nowIso
      },
      {
        userId: 'user_2',
        userName: 'Suman Gupta',
        userPhone: '9812345678',
        userEmail: 'suman.gupta@example.com',
        bloodGroup: 'O+',
        location: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        donorStatus: 'ACTIVE',
        isOnline: true,
        lastHeartbeat: new Date(Date.now() - 25000).toISOString(),
        visibility: true,
        totalDonations: 2,
        lastDonationDate: '2026-01-14',
        updatedAt: nowIso
      },
      {
        userId: 'user_3',
        userName: 'Pooja Shrestha',
        userPhone: '9845678901',
        userEmail: 'pooja.shrestha@example.com',
        bloodGroup: 'A+',
        location: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        donorStatus: 'INACTIVE',
        isOnline: false,
        lastHeartbeat: new Date(Date.now() - 3600000).toISOString(),
        visibility: false,
        inactiveUntil: new Date(Date.now() + 2 * 3600000).toISOString(),
        inactiveReason: 'In office meeting & class',
        totalDonations: 6,
        lastDonationDate: '2025-08-10',
        updatedAt: nowIso
      },
      {
        userId: 'user_4',
        userName: 'Rajesh Patel',
        userPhone: '9801122334',
        userEmail: 'rajesh.patel@example.com',
        bloodGroup: 'AB+',
        location: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        donorStatus: 'ACTIVE',
        isOnline: false,
        lastHeartbeat: new Date(Date.now() - 300000).toISOString(),
        visibility: true,
        totalDonations: 1,
        lastDonationDate: '2026-03-05',
        updatedAt: nowIso
      },
      {
        userId: 'user_5',
        userName: 'Anjali Shah',
        userPhone: '9819988776',
        userEmail: 'anjali.shah@example.com',
        bloodGroup: 'O-',
        location: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        donorStatus: 'ACTIVE',
        isOnline: true,
        lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
        visibility: true,
        totalDonations: 3,
        lastDonationDate: '2025-10-18',
        updatedAt: nowIso
      }
    ];

    for (const d of initialDonors) {
      this.donors.set(d.userId, d);
    }

    const initialRequests: ActiveBloodRequestRecord[] = [
      {
        id: 'req_1',
        requesterId: 'user_2',
        requesterName: 'Suman Gupta',
        bloodGroup: 'B+',
        unitsRequired: 2,
        hospital: 'Narayani Sub-Regional Hospital',
        hospitalLocation: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        urgency: 'EMERGENCY',
        status: 'ACTIVE',
        isEmergency: true,
        requiredDate: new Date().toISOString().split('T')[0],
        requiredTime: 'Immediate',
        description: 'Urgent emergency needed for road traffic trauma surgery in ICU.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: nowIso
      },
      {
        id: 'req_2',
        requesterId: 'user_4',
        requesterName: 'Rajesh Patel',
        bloodGroup: 'AB+',
        unitsRequired: 1,
        hospital: 'National Medical College (NMC)',
        hospitalLocation: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        urgency: 'URGENT',
        status: 'ACTIVE',
        isEmergency: false,
        requiredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        requiredTime: '11:00 AM',
        description: 'Needed for scheduled C-Section delivery tomorrow morning.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: nowIso
      }
    ];

    for (const r of initialRequests) {
      this.requests.set(r.id, r);
    }

    this.auditLogs.push({
      id: 'audit_init',
      entityType: 'donor',
      entityId: 'system',
      entityName: 'Blood Sanjal Active Status Engine',
      previousStatus: 'offline',
      newStatus: 'active',
      reason: 'Backend active status service initialized successfully',
      changedBy: 'system',
      timestamp: nowIso
    });
  }

  private startAutoExpirationWorker() {
    this.expirationTimer = setInterval(() => {
      // this.checkExpiredSnoozes(); // Disabled in favor of centralized DB-driven cron in server.ts
      this.checkExpiredRequests();
    }, 10000);
  }

  public checkExpiredSnoozes() {
    const now = Date.now();
    const restoredDonors: DonorActiveStatusRecord[] = [];

    for (const [userId, donor] of this.donors.entries()) {
      if (
        donor.donorStatus === 'INACTIVE' &&
        donor.inactiveUntil &&
        new Date(donor.inactiveUntil).getTime() <= now
      ) {
        const previousStatus = donor.donorStatus;
        const previousReason = donor.inactiveReason;

        donor.donorStatus = 'ACTIVE';
        donor.visibility = true;
        donor.inactiveUntil = undefined;
        donor.inactiveReason = undefined;
        donor.updatedAt = new Date().toISOString();

        this.donors.set(userId, donor);
        restoredDonors.push(donor);

        const auditEntry: StatusAuditEntry = {
          id: `audit_auto_${Date.now()}_${userId}`,
          entityType: 'donor',
          entityId: userId,
          entityName: donor.userName,
          previousStatus,
          newStatus: 'ACTIVE',
          reason: `Auto-restored to Active after scheduled pause elapsed (${previousReason || 'Timed snooze completed'})`,
          changedBy: 'auto_engine',
          timestamp: new Date().toISOString()
        };
        this.auditLogs.unshift(auditEntry);

        if (this.auditLogs.length > 200) {
          this.auditLogs.pop();
        }
      }
    }

    if (restoredDonors.length > 0) {
      this.broadcast('donors_auto_restored', {
        count: restoredDonors.length,
        restoredDonors: restoredDonors.map((d) => ({
          userId: d.userId,
          userName: d.userName,
          bloodGroup: d.bloodGroup,
          donorStatus: d.donorStatus
        }))
      });
    }
  }

  public checkExpiredRequests() {
    const now = Date.now();
    for (const [reqId, req] of this.requests.entries()) {
      if (req.status === 'ACTIVE' && req.requiredDate) {
        const reqTimeMs = new Date(req.requiredDate).getTime() + 24 * 3600000;
        if (reqTimeMs < now - 48 * 3600000) {
          req.status = 'CLOSED'; // Using CLOSED instead of 'expired' which isn't in RequestStatus type
          req.updatedAt = new Date().toISOString();
          this.requests.set(reqId, req);

          this.broadcast('request_status_updated', {
            id: req.id,
            status: 'CLOSED',
            reason: 'Auto-expired due to past required date'
          });
        }
      }
    }
  }

  public addSseClient(res: Response) {
    this.sseClients.add(res);

    const snapshot = {
      type: 'initial_state',
      summary: this.getSummary(),
      donors: this.getAllDonors(),
      activeRequests: this.getAllRequests({ status: 'ACTIVE' })
    };
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  public broadcast(event: string, payload: any) {
    const data = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const client of this.sseClients) {
      try {
        client.write(`data: ${data}\n\n`);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  public getSummary(): ActiveStatusSummary {
    const now = Date.now();
    let totalDonors = 0;
    let activeDonorsCount = 0;
    let onlineDonorsCount = 0;
    let inactiveDonorsCount = 0;
    let recentlyDonatedCount = 0;
    let busyDonorsCount = 0;

    const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodGroupBreakdown = {} as Record<
      BloodGroup,
      { total: number; active: number; online: number }
    >;

    for (const bg of bloodGroups) {
      bloodGroupBreakdown[bg] = { total: 0, active: 0, online: 0 };
    }

    for (const donor of this.donors.values()) {
      totalDonors++;
      const isOnline = now - new Date(donor.lastHeartbeat).getTime() <= ONLINE_HEARTBEAT_THRESHOLD_MS;

      if (donor.bloodGroup && bloodGroupBreakdown[donor.bloodGroup]) {
        bloodGroupBreakdown[donor.bloodGroup].total++;
        if (donor.donorStatus === 'ACTIVE') {
          bloodGroupBreakdown[donor.bloodGroup].active++;
        }
        if (isOnline) {
          bloodGroupBreakdown[donor.bloodGroup].online++;
        }
      }

      if (isOnline) onlineDonorsCount++;

      switch (donor.donorStatus) {
        case 'ACTIVE':
          activeDonorsCount++;
          break;
        case 'INACTIVE':
          inactiveDonorsCount++;
          break;
        // The prompt's code used 'recently_donated' and 'busy' but they are not in DonorStatus type.
        // I will map them accordingly or skip if not matching.
      }
    }

    let activeEmergencyRequestsCount = 0;
    let activeUrgentRequestsCount = 0;
    let totalActiveRequestsCount = 0;

    for (const req of this.requests.values()) {
      if (req.status === 'ACTIVE') {
        totalActiveRequestsCount++;
        if (req.urgency === 'EMERGENCY') activeEmergencyRequestsCount++;
        else if (req.urgency === 'URGENT') activeUrgentRequestsCount++;
      }
    }

    return {
      totalDonors,
      activeDonorsCount,
      onlineDonorsCount,
      inactiveDonorsCount,
      recentlyDonatedCount,
      busyDonorsCount,
      activeEmergencyRequestsCount,
      activeUrgentRequestsCount,
      totalActiveRequestsCount,
      bloodGroupBreakdown,
      serverUptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      lastSyncedAt: new Date().toISOString()
    };
  }

  public getAllDonors(filters?: {
    status?: DonorStatus | 'all';
    bloodGroup?: BloodGroup | 'all';
    district?: string;
    onlineOnly?: boolean;
    search?: string;
  }): DonorActiveStatusRecord[] {
    const now = Date.now();
    let result = Array.from(this.donors.values()).map((donor) => ({
      ...donor,
      isOnline: now - new Date(donor.lastHeartbeat).getTime() <= ONLINE_HEARTBEAT_THRESHOLD_MS
    }));

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        result = result.filter((d) => d.donorStatus === filters.status);
      }
      if (filters.bloodGroup && filters.bloodGroup !== 'all') {
        result = result.filter((d) => d.bloodGroup === filters.bloodGroup);
      }
      if (filters.district) {
        result = result.filter(
          (d) => d.location.districtId.toLowerCase() === filters.district!.toLowerCase()
        );
      }
      if (filters.onlineOnly) {
        result = result.filter((d) => d.isOnline);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (d) =>
            d.userName.toLowerCase().includes(query) ||
            d.location.cityId.toLowerCase().includes(query) ||
            d.bloodGroup.toLowerCase().includes(query)
        );
      }
    }

    return result;
  }

  public getDonor(userId: string): DonorActiveStatusRecord | null {
    const donor = this.donors.get(userId);
    if (!donor) return null;
    return {
      ...donor,
      isOnline: Date.now() - new Date(donor.lastHeartbeat).getTime() <= ONLINE_HEARTBEAT_THRESHOLD_MS
    };
  }

  public updateDonorStatus(
    userId: string,
    payload: UpdateDonorStatusPayload
  ): DonorActiveStatusRecord {
    let donor = this.donors.get(userId);

    if (!donor) {
      donor = {
        userId,
        userName: payload.changedBy || 'Donor User',
        userPhone: '',
        userEmail: '',
        bloodGroup: 'O+',
        location: {
          provinceId: 'Madhesh Province',
          districtId: 'Parsa',
          cityId: 'Birgunj Metropolitan City'
        },
        donorStatus: payload.status,
        isOnline: true,
        lastHeartbeat: new Date().toISOString(),
        visibility: payload.visibility ?? (payload.status === 'ACTIVE'),
        totalDonations: 0,
        updatedAt: new Date().toISOString()
      };
    }

    const previousStatus = donor.donorStatus;
    donor.donorStatus = payload.status;
    donor.visibility = payload.visibility ?? (payload.status === 'ACTIVE');
    donor.updatedAt = new Date().toISOString();

    if (payload.status === 'ACTIVE') {
      donor.inactiveUntil = undefined;
      donor.inactiveReason = undefined;
    } else if (payload.status === 'INACTIVE') {
      if (payload.inactiveUntil) {
        donor.inactiveUntil = payload.inactiveUntil;
      } else if (payload.inactiveHours) {
        donor.inactiveUntil = new Date(Date.now() + payload.inactiveHours * 3600000).toISOString();
      } else if (payload.inactiveDays) {
        donor.inactiveUntil = new Date(Date.now() + payload.inactiveDays * 86400000).toISOString();
      } else {
        donor.inactiveUntil = undefined;
      }
      donor.inactiveReason = payload.inactiveReason;
    }

    this.donors.set(userId, donor);

    const auditEntry: StatusAuditEntry = {
      id: `audit_${Date.now()}_${userId}`,
      entityType: 'donor',
      entityId: userId,
      entityName: donor.userName,
      previousStatus,
      newStatus: payload.status,
      reason: payload.inactiveReason || (payload.status === 'ACTIVE' ? 'Marked active by user' : undefined),
      changedBy: payload.changedBy || userId,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(auditEntry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();

    const result = {
      ...donor,
      isOnline: Date.now() - new Date(donor.lastHeartbeat).getTime() <= ONLINE_HEARTBEAT_THRESHOLD_MS
    };

    this.broadcast('donor_status_changed', {
      donor: result,
      audit: auditEntry,
      summary: this.getSummary()
    });

    return result;
  }

  public recordHeartbeat(payload: HeartbeatPayload): { success: boolean; isOnline: boolean } {
    const nowIso = new Date().toISOString();
    let donor = this.donors.get(payload.userId);

    if (donor) {
      donor.lastHeartbeat = nowIso;
      donor.isOnline = true;
      this.donors.set(payload.userId, donor);
    }

    this.broadcast('heartbeat_ping', {
      userId: payload.userId,
      timestamp: nowIso
    });

    return { success: true, isOnline: true };
  }

  public getAllRequests(filters?: {
    status?: RequestStatus | 'all';
    urgency?: RequestUrgency | 'all';
    bloodGroup?: BloodGroup | 'all';
  }): ActiveBloodRequestRecord[] {
    let result = Array.from(this.requests.values());

    if (filters) {
      if (filters.status && filters.status !== 'all') {
        result = result.filter((r) => r.status === filters.status);
      }
      if (filters.urgency && filters.urgency !== 'all') {
        result = result.filter((r) => r.urgency === filters.urgency);
      }
      if (filters.bloodGroup && filters.bloodGroup !== 'all') {
        result = result.filter((r) => r.bloodGroup === filters.bloodGroup);
      }
    }

    return result.sort((a, b) => {
      if (a.urgency === 'EMERGENCY' && b.urgency !== 'EMERGENCY') return -1;
      if (b.urgency === 'EMERGENCY' && a.urgency !== 'EMERGENCY') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public updateRequestStatus(
    requestId: string,
    newStatus: RequestStatus,
    changedBy: string = 'admin',
    reason?: string
  ): ActiveBloodRequestRecord | null {
    const req = this.requests.get(requestId);
    if (!req) return null;

    const previousStatus = req.status;
    req.status = newStatus;
    req.updatedAt = new Date().toISOString();
    this.requests.set(requestId, req);

    const auditEntry: StatusAuditEntry = {
      id: `audit_req_${Date.now()}_${requestId}`,
      entityType: 'blood_request',
      entityId: requestId,
      entityName: `${req.bloodGroup} at ${req.hospital}`,
      previousStatus,
      newStatus,
      reason,
      changedBy,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(auditEntry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();

    this.broadcast('request_status_changed', {
      request: req,
      audit: auditEntry,
      summary: this.getSummary()
    });

    return req;
  }

  public registerNewRequest(
    data: Omit<ActiveBloodRequestRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
      status?: RequestStatus;
    }
  ): ActiveBloodRequestRecord {
    const id = `req_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newRecord: ActiveBloodRequestRecord = {
      ...data,
      id,
      status: data.status || 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.requests.set(id, newRecord);

    this.broadcast('new_active_request', {
      request: newRecord,
      summary: this.getSummary()
    });

    return newRecord;
  }

  public getAuditLogs(limit: number = 50): StatusAuditEntry[] {
    return this.auditLogs.slice(0, limit);
  }

  public destroy() {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
  }
}

export const activeStatusService = new ActiveStatusService();
