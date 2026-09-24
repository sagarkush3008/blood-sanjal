import { BloodRequest, IBloodRequest } from './bloodRequest.model';
import { AuditLog } from '../audit/auditLog.model';
import { AppError } from '../../core/errors/appError';

export class BloodRequestService {
  static async createRequest(userId: string, data: any) {
    // Check for duplicate pending/active requests for same blood group
    const duplicate = await BloodRequest.findOne({
      requesterId: userId,
      bloodGroup: data.bloodGroup,
      status: { $in: ['PENDING_VERIFICATION', 'ACTIVE', 'PARTIALLY_FULFILLED'] }
    });
    if (duplicate) {
      throw new AppError(409, 'CONFLICT', 'You already have an active request for this blood group');
    }

    const request = await BloodRequest.create({
      ...data,
      requesterId: userId,
      status: data.urgency === 'EMERGENCY' ? 'PENDING_VERIFICATION' : 'PENDING_VERIFICATION' // All require verification for safety
    });

    await AuditLog.create({
      actorId: userId,
      action: 'BLOOD_REQUEST_CREATED',
      entityType: 'BloodRequest',
      entityId: request._id.toString()
    });

    return request;
  }

  static async updateRequest(requestId: string, userId: string, data: any) {
    const request = await BloodRequest.findOne({ _id: requestId, requesterId: userId });
    if (!request) throw new AppError(404, 'NOT_FOUND', 'Request not found');

    if (!['DRAFT', 'PENDING_VERIFICATION'].includes(request.status)) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot update an active or fulfilled request');
    }

    const updated = await BloodRequest.findByIdAndUpdate(requestId, { $set: data }, { new: true });
    
    await AuditLog.create({
      actorId: userId,
      action: 'BLOOD_REQUEST_UPDATED',
      entityType: 'BloodRequest',
      entityId: requestId
    });

    return updated;
  }

  static async verifyRequest(requestId: string, adminId: string, activate: boolean) {
    const request = await BloodRequest.findById(requestId);
    if (!request) throw new AppError(404, 'NOT_FOUND', 'Request not found');

    if (request.status !== 'PENDING_VERIFICATION') {
      throw new AppError(400, 'BAD_REQUEST', `Cannot verify request in status ${request.status}`);
    }

    request.status = activate ? 'ACTIVE' : 'VERIFIED';
    await request.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'BLOOD_REQUEST_VERIFIED',
      entityType: 'BloodRequest',
      entityId: requestId
    });

    return request;
  }

  static async fulfillUnits(requestId: string, units: number, actorId: string) {
    const request = await BloodRequest.findById(requestId);
    if (!request) throw new AppError(404, 'NOT_FOUND', 'Request not found');

    if (!['ACTIVE', 'PARTIALLY_FULFILLED'].includes(request.status)) {
      throw new AppError(400, 'BAD_REQUEST', 'Request is not active');
    }

    if (request.unitsFulfilled + units > request.unitsRequired) {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot fulfill more units than required');
    }

    request.unitsFulfilled += units;
    
    if (request.unitsFulfilled >= request.unitsRequired) {
      request.status = 'FULFILLED';
    } else {
      request.status = 'PARTIALLY_FULFILLED';
    }

    await request.save();

    await AuditLog.create({
      actorId: actorId,
      action: 'BLOOD_REQUEST_FULFILLED',
      entityType: 'BloodRequest',
      entityId: requestId
    });

    return request;
  }

  static async cancelRequest(requestId: string, userId: string) {
    const request = await BloodRequest.findOne({ _id: requestId, requesterId: userId });
    if (!request) throw new AppError(404, 'NOT_FOUND', 'Request not found');

    if (['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status)) {
      throw new AppError(400, 'BAD_REQUEST', 'Request cannot be cancelled');
    }

    request.status = 'CANCELLED';
    await request.save();

    return request;
  }
}
