import { Response } from 'express';
import mongoose from 'mongoose';
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
import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { BloodRequest } from '../requests/bloodRequest.model';
import { AuditLog } from '../audit/auditLog.model';

const ONLINE_HEARTBEAT_THRESHOLD_MS = 90 * 1000; // 90 seconds

class ActiveStatusService {
  private donors: Map<string, DonorActiveStatusRecord> = new Map();
  private requests: Map<string, ActiveBloodRequestRecord> = new Map();
  private auditLogs: StatusAuditEntry[] = [];
  private sseClients: Set<Response> = new Set();
  private expirationTimer: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private isInitialized: boolean = false;

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      this.startAutoExpirationWorker();
      const timeout = setTimeout(() => {
        this.syncWithDatabase().catch((err) =>
          console.error('[ActiveStatusService] Initial DB sync error:', err)
        );
      }, 1000);
      timeout.unref?.();
    }
  }

  public stop(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
    }
  }

  public async syncWithDatabase(): Promise<void> {
    try {
      const profilesQuery = DonorProfile.find();
      const profiles = (profilesQuery && typeof profilesQuery.populate === 'function')
        ? await profilesQuery.populate('userId')
        : [];
      if (!Array.isArray(profiles)) return;
      const now = Date.now();

      for (const p of profiles) {
        const u = p.userId as any;
        if (!u || !u._id) continue;
        const userIdStr = u._id.toString();

        const lastHb = u.lastHeartbeat
          ? new Date(u.lastHeartbeat).toISOString()
          : new Date(Date.now() - 300000).toISOString();
        const isOnline = now - new Date(lastHb).getTime() <= ONLINE_HEARTBEAT_THRESHOLD_MS;

        this.donors.set(userIdStr, {
          userId: userIdStr,
          userName: u.name || 'Donor',
          userPhone: u.phone || '',
          userEmail: u.email || '',
          bloodGroup: (p.bloodGroup || u.bloodGroup || 'O+') as BloodGroup,
          location: {
            provinceId: u.provinceId ? String(u.provinceId) : '',
            districtId: u.districtId ? String(u.districtId) : '',
            cityId: u.cityId ? String(u.cityId) : ''
          },
          donorStatus: (p.manualAvailabilityStatus === 'ACTIVE' || p.donorStatus === 'ACTIVE' || p.donorStatus === 'RESTING') ? 'ACTIVE' : 'INACTIVE',
          isOnline,
          lastHeartbeat: lastHb,
          visibility: (p.manualAvailabilityStatus === 'ACTIVE' || p.donorStatus === 'ACTIVE' || p.donorStatus === 'RESTING'),
          inactiveUntil: p.manualInactiveUntil ? p.manualInactiveUntil.toISOString() : undefined,
          inactiveReason: p.manualInactiveReason || p.inactiveReason || undefined,
          totalDonations: p.totalDonations || 0,
          lastDonationDate: p.lastDonationDate
            ? p.lastDonationDate.toISOString().split('T')[0]
            : undefined,
          updatedAt: ((p as any).updatedAt || new Date()).toISOString()
        });
      }

      const reqQuery = BloodRequest.find({
        status: { $in: ['ACTIVE', 'PENDING_VERIFICATION'] }
      });
      const activeReqs = (reqQuery && typeof reqQuery.populate === 'function')
        ? await reqQuery.populate('requesterId')
        : [];
      if (!Array.isArray(activeReqs)) return;

      for (const r of activeReqs) {
        if (!r || !r._id) continue;
        const reqUser = r.requesterId as any;
        const reqIdStr = r._id.toString();
        const requesterIdStr = reqUser?._id
          ? reqUser._id.toString()
          : (r.requesterId ? r.requesterId.toString() : 'unknown');

        this.requests.set(reqIdStr, {
          id: reqIdStr,
          requesterId: requesterIdStr,
          requesterName: reqUser?.name || 'Patient Family',
          bloodGroup: (r.bloodGroup || 'O+') as BloodGroup,
          unitsRequired: r.unitsRequired || 1,
          hospital: r.hospitalName || 'Hospital',
          hospitalLocation: {
            provinceId: r.hospitalLocation?.provinceId || '',
            districtId: r.hospitalLocation?.districtId || '',
            cityId: r.hospitalLocation?.cityId || ''
          },
          urgency: (r.urgency as RequestUrgency) || 'NORMAL',
          status: (r.status as RequestStatus) || 'ACTIVE',
          isEmergency: r.urgency === 'EMERGENCY',
          requiredDate: r.requiredDate ? r.requiredDate.toISOString() : new Date().toISOString(),
          requiredTime: 'ASAP',
          description: r.reason || '',
          createdAt: (r.createdAt || new Date()).toISOString(),
          updatedAt: (r.updatedAt || new Date()).toISOString()
        });
      }

      this.isInitialized = true;
    } catch (e) {
      console.error('[ActiveStatusService] syncWithDatabase error:', e);
    }
  }

  private startAutoExpirationWorker() {
    this.expirationTimer = setInterval(() => {
      this.checkExpiredSnoozes().catch((err) =>
        console.error('[ActiveStatusService] Auto-restore error:', err)
      );
      this.checkExpiredRequests().catch((err) =>
        console.error('[ActiveStatusService] Request expiration error:', err)
      );
    }, 15000);
    this.expirationTimer.unref?.();
  }

  public async checkExpiredSnoozes(): Promise<number> {
    const now = new Date();
    const nowMs = now.getTime();
    const restoredDonors: DonorActiveStatusRecord[] = [];

    // 1. Check in-memory map
    for (const [userId, donor] of this.donors.entries()) {
      if (
        donor.donorStatus === 'INACTIVE' &&
        donor.inactiveUntil &&
        new Date(donor.inactiveUntil).getTime() <= nowMs
      ) {
        const previousStatus = donor.donorStatus;
        const previousReason = donor.inactiveReason;

        donor.donorStatus = 'ACTIVE';
        donor.visibility = true;
        donor.inactiveUntil = undefined;
        donor.inactiveReason = undefined;
        donor.updatedAt = now.toISOString();

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
          timestamp: now.toISOString()
        };
        this.auditLogs.unshift(auditEntry);
        if (this.auditLogs.length > 200) this.auditLogs.pop();
      }
    }

    // 2. Persist to MongoDB DonorProfile
    try {
      const expiredDbDonors = await DonorProfile.find({
        donorStatus: 'INACTIVE',
        inactiveUntil: { $lte: now }
      });

      if (Array.isArray(expiredDbDonors)) {
        for (const p of expiredDbDonors) {
          p.donorStatus = 'ACTIVE';
          p.availabilityMode = 'AVAILABLE';
          p.inactiveUntil = null;
          p.inactiveReason = null;
          p.inactiveUnit = null;
          p.inactiveDuration = null;
          p.lastStatusChangedAt = now;
          await p.save();
        }
      }
    } catch (e) {
      console.error('[ActiveStatusService] DB restore error:', e);
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

    return restoredDonors.length;
  }

  public async checkExpiredRequests(): Promise<void> {
    const now = Date.now();
    for (const [reqId, req] of this.requests.entries()) {
      if (req.status === 'ACTIVE' && req.requiredDate) {
        const reqTimeMs = new Date(req.requiredDate).getTime() + 24 * 3600000;
        if (reqTimeMs < now - 48 * 3600000) {
          req.status = 'CLOSED';
          req.updatedAt = new Date().toISOString();
          this.requests.set(reqId, req);

          try {
            await BloodRequest.findByIdAndUpdate(reqId, { status: 'CLOSED' });
          } catch (e) {}

          this.broadcast('request_status_updated', {
            id: req.id,
            status: 'CLOSED',
            reason: 'Auto-expired due to past required date'
          });
        }
      }
    }
  }

  public addSseClient(res: Response): void {
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

  public broadcast(event: string, payload: any): void {
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
      const isOnline =
        now - new Date(donor.lastHeartbeat).getTime() <= ONLINE_HEARTBEAT_THRESHOLD_MS;

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
          if (donor.inactiveUntil) {
            busyDonorsCount++;
          }
          break;
      }

      if (donor.lastDonationDate) {
        const donationTime = new Date(donor.lastDonationDate).getTime();
        if (now - donationTime < 90 * 86400000) {
          recentlyDonatedCount++;
        }
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
          (d) =>
            d.location?.districtId &&
            d.location.districtId.toLowerCase() === filters.district!.toLowerCase()
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
            (d.location?.cityId && d.location.cityId.toLowerCase().includes(query)) ||
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

  public async updateDonorStatus(
    userId: string,
    payload: UpdateDonorStatusPayload
  ): Promise<DonorActiveStatusRecord> {
    const now = new Date();
    const nowIso = now.toISOString();
    let donor = this.donors.get(userId);

    // If not in map, look up user from DB
    if (!donor) {
      let userName = payload.changedBy || 'Donor User';
      let bloodGroup: BloodGroup = 'O+';
      let location = { provinceId: '', districtId: '', cityId: '' };

      if (mongoose.connection.readyState === 1) {
        try {
          const u = await User.findById(userId);
          if (u) {
            userName = u.name;
            bloodGroup = (u.bloodGroup as BloodGroup) || 'O+';
            location = {
              provinceId: u.provinceId ? String(u.provinceId) : '',
              districtId: u.districtId ? String(u.districtId) : '',
              cityId: u.cityId ? String(u.cityId) : ''
            };
          }
        } catch (e) {}
      }

      donor = {
        userId,
        userName,
        userPhone: '',
        userEmail: '',
        bloodGroup,
        location,
        donorStatus: payload.status,
        isOnline: true,
        lastHeartbeat: nowIso,
        visibility: payload.visibility ?? payload.status === 'ACTIVE',
        totalDonations: 0,
        updatedAt: nowIso
      };
    }

    const previousStatus = donor.donorStatus;
    donor.donorStatus = payload.status;
    donor.visibility = payload.visibility ?? payload.status === 'ACTIVE';
    donor.updatedAt = nowIso;

    let inactiveUntilDate: Date | null = null;

    if (payload.status === 'ACTIVE') {
      donor.inactiveUntil = undefined;
      donor.inactiveReason = undefined;
    } else if (payload.status === 'INACTIVE') {
      if (payload.inactiveUntil) {
        donor.inactiveUntil = payload.inactiveUntil;
        inactiveUntilDate = new Date(payload.inactiveUntil);
      } else if (payload.inactiveHours) {
        inactiveUntilDate = new Date(Date.now() + payload.inactiveHours * 3600000);
        donor.inactiveUntil = inactiveUntilDate.toISOString();
      } else if (payload.inactiveDays) {
        inactiveUntilDate = new Date(Date.now() + payload.inactiveDays * 86400000);
        donor.inactiveUntil = inactiveUntilDate.toISOString();
      } else {
        donor.inactiveUntil = undefined;
      }
      donor.inactiveReason = payload.inactiveReason;
    }

    this.donors.set(userId, donor);

    // Persist to MongoDB DonorProfile!
    if (mongoose.connection.readyState === 1) {
      try {
        let profile = await DonorProfile.findOne({ userId });
        if (!profile) {
          const u = await User.findById(userId);
          profile = await DonorProfile.create({
            userId,
            bloodGroup: u?.bloodGroup || donor.bloodGroup || 'O+',
            donorStatus: payload.status
          });
        }

        profile.donorStatus = payload.status;
        profile.lastStatusChangedAt = now;
        if (payload.changedBy && mongoose.isValidObjectId(payload.changedBy)) {
          profile.lastStatusChangedBy = payload.changedBy as any;
        }

        if (payload.status === 'ACTIVE') {
          profile.availabilityMode = 'AVAILABLE';
          profile.inactiveUntil = undefined;
          profile.inactiveReason = undefined;
          profile.inactiveUnit = undefined;
          profile.inactiveDuration = undefined;
          profile.inactiveStartedAt = undefined;
          delete profile.inactiveUntil;
          delete profile.inactiveReason;
          delete profile.inactiveUnit;
          delete profile.inactiveDuration;
          delete profile.inactiveStartedAt;
        } else {
          profile.availabilityMode = inactiveUntilDate ? 'TEMPORARY_INACTIVE' : 'INDEFINITE_INACTIVE';
          profile.inactiveUntil = inactiveUntilDate;
          profile.inactiveReason = payload.inactiveReason || null;
          profile.inactiveStartedAt = now;
          if (payload.inactiveHours) {
            profile.inactiveUnit = 'HOURS';
            profile.inactiveDuration = payload.inactiveHours;
          } else if (payload.inactiveDays) {
            profile.inactiveUnit = 'DAYS';
            profile.inactiveDuration = payload.inactiveDays;
          }
        }

        await profile.save();
      } catch (err) {
        console.error('[ActiveStatusService] Error persisting to DonorProfile:', err);
      }
    }

    // Persist Audit Log
    const auditEntry: StatusAuditEntry = {
      id: `audit_${Date.now()}_${userId}`,
      entityType: 'donor',
      entityId: userId,
      entityName: donor.userName,
      previousStatus,
      newStatus: payload.status,
      reason:
        payload.inactiveReason || (payload.status === 'ACTIVE' ? 'Marked active by user' : undefined),
      changedBy: payload.changedBy || userId,
      timestamp: nowIso
    };
    this.auditLogs.unshift(auditEntry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();

    if (mongoose.connection.readyState === 1) {
      try {
        await AuditLog.create({
          actorId: (payload.changedBy && mongoose.isValidObjectId(payload.changedBy))
            ? new mongoose.Types.ObjectId(payload.changedBy)
            : (mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : undefined),
          action: payload.status === 'ACTIVE' ? 'DONOR_AVAILABLE' : 'DONOR_UNAVAILABLE',
          entityType: 'DonorProfile',
          entityId: userId,
          metadata: {
            previousStatus,
            newStatus: payload.status,
            inactiveUntil: donor.inactiveUntil,
            reason: payload.inactiveReason
          }
        });
      } catch (e) {}
    }

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

  public async recordHeartbeat(
    payload: HeartbeatPayload
  ): Promise<{ success: boolean; isOnline: boolean }> {
    const nowIso = new Date().toISOString();
    let donor = this.donors.get(payload.userId);

    if (donor) {
      donor.lastHeartbeat = nowIso;
      donor.isOnline = true;
      this.donors.set(payload.userId, donor);
    } else {
      try {
        const u = await User.findById(payload.userId);
        if (u) {
          const p = await DonorProfile.findOne({ userId: payload.userId });
          donor = {
            userId: payload.userId,
            userName: u.name || 'Donor',
            userPhone: u.phone || '',
            userEmail: u.email || '',
            bloodGroup: (p?.bloodGroup || u.bloodGroup || 'O+') as BloodGroup,
            location: {
              provinceId: u.provinceId ? String(u.provinceId) : '',
              districtId: u.districtId ? String(u.districtId) : '',
              cityId: u.cityId ? String(u.cityId) : ''
            },
            donorStatus: ((p?.manualAvailabilityStatus === 'ACTIVE' || p?.donorStatus === 'ACTIVE' || p?.donorStatus === 'RESTING') ? 'ACTIVE' : 'INACTIVE') as DonorStatus,
            isOnline: true,
            lastHeartbeat: nowIso,
            visibility: (p?.manualAvailabilityStatus === 'ACTIVE' || p?.donorStatus === 'ACTIVE' || p?.donorStatus === 'RESTING'),
            inactiveUntil: p?.manualInactiveUntil ? p.manualInactiveUntil.toISOString() : undefined,
            inactiveReason: p?.manualInactiveReason || p?.inactiveReason || undefined,
            totalDonations: p?.totalDonations || 0,
            lastDonationDate: p?.lastDonationDate
              ? p.lastDonationDate.toISOString().split('T')[0]
              : undefined,
            updatedAt: nowIso
          };
          this.donors.set(payload.userId, donor);
        }
      } catch (e) {}
    }

    try {
      await User.findByIdAndUpdate(payload.userId, {
        lastHeartbeat: new Date(),
        onlinePlatform: payload.platform || 'mobile'
      });
    } catch (e) {}

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

  public async updateRequestStatus(
    requestId: string,
    newStatus: RequestStatus,
    changedBy: string = 'admin',
    reason?: string
  ): Promise<ActiveBloodRequestRecord | null> {
    const req = this.requests.get(requestId);
    if (!req) return null;

    const previousStatus = req.status;
    req.status = newStatus;
    req.updatedAt = new Date().toISOString();
    this.requests.set(requestId, req);

    try {
      await BloodRequest.findByIdAndUpdate(requestId, { status: newStatus });
    } catch (e) {}

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

  public destroy(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
    }
  }
}

export const activeStatusService = new ActiveStatusService();
