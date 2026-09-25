import { AuditLog } from './auditLog.model';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Request } from 'express';

export class AuditService {
  static async logAction(
    actorId: string | mongoose.Types.ObjectId | undefined,
    action: string,
    entityType?: string,
    entityId?: string,
    req?: Request | null,
    overrideIpHash?: string,
    overrideUserAgent?: string
  ) {
    let ipHash = overrideIpHash;
    let userAgent = overrideUserAgent;

    if (req) {
      if (req.ip) {
        ipHash = crypto.createHash('sha256').update(req.ip).digest('hex');
      }
      if (req.headers['user-agent']) {
        const ua = req.headers['user-agent'];
        userAgent = ua.length > 50 ? ua.substring(0, 50) + '...' : ua;
      }
    }

    const log = await AuditLog.create({
      actorId: actorId ? new mongoose.Types.ObjectId(actorId as string) : undefined,
      action,
      entityType,
      entityId,
      requestId: req?.id,
      ipHash,
      userAgent
    });
    return log;
  }

  static async getLogs(query: any) {
    const filter: any = {};
    if (query.actorId) filter.actorId = query.actorId;
    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.requestId) filter.requestId = query.requestId;
    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate as string),
        $lte: new Date(query.endDate as string)
      };
    }

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');

    const logs = await AuditLog.find(filter)
      .populate('actorId', 'name email role')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await AuditLog.countDocuments(filter);
    
    return { data: logs, total, page, limit };
  }
}
