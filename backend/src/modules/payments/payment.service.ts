import mongoose from 'mongoose';
import { PaymentTransaction, PaymentPurpose } from './payment.model';
import { feeConfig } from '../../config/fee.config';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';
import { MockPaymentProvider } from './providers/mockProvider';
import { EsewaPaymentProvider } from './providers/esewaProvider';
import { KhaltiPaymentProvider } from './providers/khaltiProvider';
import { IPaymentProvider } from './providers/paymentProvider.interface';

const mockPaymentProvider = new MockPaymentProvider();
const esewaPaymentProvider = new EsewaPaymentProvider();
const khaltiPaymentProvider = new KhaltiPaymentProvider();

function resolveProvider(gatewayName?: string): IPaymentProvider {
  if (gatewayName === 'ESEWA') return esewaPaymentProvider;
  if (gatewayName === 'KHALTI') return khaltiPaymentProvider;
  return mockPaymentProvider;
}

export class PaymentService {
  static async initiateSearchFee(userId: string) {
    if (!feeConfig.SEARCH_FEE_ENABLED) return { status: 'FREE' };
    
    const validFrom = new Date(Date.now() - feeConfig.SEARCH_FEE_VALIDITY_HOURS * 3600 * 1000);
    const existing = await PaymentTransaction.findOne({
      userId,
      purpose: 'SEARCH_PLATFORM_FEE',
      status: 'SUCCESS',
      updatedAt: { $gte: validFrom }
    });

    if (existing) return { status: 'ALREADY_PAID', transactionId: existing._id };

    const amountMinor = feeConfig.SEARCH_FEE_AMOUNT * 100; // Converting to paisa

    const tx = await PaymentTransaction.create({
      userId,
      amountMinor,
      purpose: 'SEARCH_PLATFORM_FEE',
      currency: feeConfig.CURRENCY
    });

    const initData = await mockPaymentProvider.initiatePayment(tx._id.toString(), tx.amountMinor, tx.currency, tx.purpose);

    tx.gatewayTransactionId = initData.providerTransactionId;
    tx.gateway = 'MOCK_GATEWAY';
    tx.metadata = { rawInit: initData.rawResponse };
    await tx.save();

    return { 
      status: 'PENDING', 
      transactionId: tx._id, 
      paymentUrl: initData.paymentUrl,
      amountMinor: tx.amountMinor, 
      currency: tx.currency,
      disclaimer: feeConfig.DISCLAIMER
    };
  }

  static async initiatePayment(params: {
    userId: string;
    amountMinor: number;
    purpose?: PaymentPurpose;
    currency?: string;
    gateway?: string;
    idempotencyKey?: string;
    metadata?: Record<string, any>;
  }) {
    const { userId, amountMinor, purpose = 'DONATION_CONTRIBUTION', currency = 'NPR', gateway = 'MOCK_GATEWAY', idempotencyKey, metadata } = params;

    if (!amountMinor || amountMinor <= 0 || !Number.isInteger(amountMinor)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Amount must be a positive integer in minor units');
    }

    // Idempotency check: prevent duplicate charges
    if (idempotencyKey) {
      const existing = await PaymentTransaction.findOne({ idempotencyKey });
      if (existing) {
        return {
          status: existing.status,
          transactionId: existing._id,
          gatewayTransactionId: existing.gatewayTransactionId,
          amountMinor: existing.amountMinor,
          currency: existing.currency,
          purpose: existing.purpose,
          gateway: existing.gateway,
          isReplay: true
        };
      }
    }

    const tx = await PaymentTransaction.create({
      userId,
      amountMinor,
      purpose,
      currency,
      gateway,
      idempotencyKey,
      metadata: metadata || {}
    });

    const provider = resolveProvider(gateway);
    const initData = await provider.initiatePayment(tx._id.toString(), tx.amountMinor, tx.currency, tx.purpose);

    tx.gatewayTransactionId = initData.providerTransactionId;
    tx.gateway = gateway;
    tx.metadata = { ...metadata, rawInit: initData.rawResponse };
    await tx.save();

    return {
      status: 'PENDING',
      transactionId: tx._id,
      gatewayTransactionId: tx.gatewayTransactionId,
      paymentUrl: initData.paymentUrl,
      amountMinor: tx.amountMinor,
      currency: tx.currency,
      purpose: tx.purpose,
      gateway: tx.gateway
    };
  }

  static async handleWebhook(gatewayTxId: string, rawPayload?: any) {
    const tx = await PaymentTransaction.findOne({ gatewayTransactionId: gatewayTxId });
    if (!tx) throw new AppError(404, 'NOT_FOUND', 'Transaction not found');
    
    if (tx.status === 'SUCCESS' || tx.status === 'REFUNDED') {
      return tx; // Idempotent success / replay safety
    }

    const provider = resolveProvider(tx.gateway);
    const verification = await provider.verifyPayment(gatewayTxId, tx.amountMinor, rawPayload);

    tx.status = verification.status;
    tx.metadata = { ...tx.metadata, webhookRaw: verification.rawResponse };
    await tx.save();

    if (tx.status === 'SUCCESS') {
      await AuditLog.create({
        actorId: tx.userId,
        action: tx.purpose === 'SEARCH_PLATFORM_FEE' ? 'SEARCH_PLATFORM_FEE_PAID' : 'PAYMENT_SUCCESS',
        entityType: 'PaymentTransaction',
        entityId: tx._id.toString()
      });
    }

    return tx;
  }

  static async hasValidSearchFee(userId: string) {
    if (!feeConfig.SEARCH_FEE_ENABLED) return true;
    
    const validFrom = new Date(Date.now() - feeConfig.SEARCH_FEE_VALIDITY_HOURS * 3600 * 1000);
    const existing = await PaymentTransaction.findOne({
      userId,
      purpose: 'SEARCH_PLATFORM_FEE',
      status: 'SUCCESS',
      updatedAt: { $gte: validFrom }
    });
    
    return !!existing;
  }

  static async getUserPaymentHistory(userId: string) {
    return PaymentTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .select('-metadata'); // privacy: hide metadata from user
  }

  static async getPaymentById(paymentId: string, requestingUserId?: string, userRole?: string) {
    const tx = await PaymentTransaction.findById(paymentId).populate('userId', 'name email phone');
    if (!tx) throw new AppError(404, 'NOT_FOUND', 'Payment transaction not found');

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin && tx.userId && tx.userId._id.toString() !== requestingUserId) {
      throw new AppError(403, 'FORBIDDEN', 'You are not authorized to view this payment transaction');
    }

    return tx;
  }

  static async getAdminPaymentReport(filters: any = {}) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.purpose) query.purpose = filters.purpose;
    if (filters.gateway) query.gateway = filters.gateway;
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    return PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');
  }

  static async getAdminPaymentSummary() {
    const [overallSummary, statusBreakdown, gatewayBreakdown, purposeBreakdown, recent24h] = await Promise.all([
      PaymentTransaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, totalRevenueMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }
      ]),
      PaymentTransaction.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalMinor: { $sum: '$amountMinor' } } }
      ]),
      PaymentTransaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: '$gateway', totalRevenueMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }
      ]),
      PaymentTransaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: '$purpose', totalRevenueMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }
      ]),
      PaymentTransaction.aggregate([
        { 
          $match: { 
            status: 'SUCCESS', 
            createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } 
          } 
        },
        { $group: { _id: null, revenueMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }
      ])
    ]);

    const totalRevenueMinor = overallSummary[0]?.totalRevenueMinor || 0;
    const totalSuccessCount = overallSummary[0]?.count || 0;
    const totalTransactions = statusBreakdown.reduce((acc, curr) => acc + curr.count, 0);

    const statuses: Record<string, number> = {
      SUCCESS: 0,
      PENDING: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    };
    statusBreakdown.forEach(s => {
      if (s._id) statuses[s._id] = s.count;
    });

    return {
      totalRevenueMinor,
      totalRevenueNpr: Number((totalRevenueMinor / 100).toFixed(2)),
      currency: feeConfig.CURRENCY,
      totalTransactions,
      totalSuccessCount,
      statusBreakdown: statuses,
      gatewayBreakdown: gatewayBreakdown.map(g => ({
        gateway: g._id || 'UNKNOWN',
        count: g.count,
        revenueMinor: g.totalRevenueMinor,
        revenueNpr: Number((g.totalRevenueMinor / 100).toFixed(2))
      })),
      purposeBreakdown: purposeBreakdown.map(p => ({
        purpose: p._id,
        count: p.count,
        revenueMinor: p.totalRevenueMinor,
        revenueNpr: Number((p.totalRevenueMinor / 100).toFixed(2))
      })),
      recent24h: {
        count: recent24h[0]?.count || 0,
        revenueMinor: recent24h[0]?.revenueMinor || 0,
        revenueNpr: Number(((recent24h[0]?.revenueMinor || 0) / 100).toFixed(2))
      }
    };
  }

  static async refundPayment(paymentId: string, adminId: string, reason: string) {
    const tx = await PaymentTransaction.findById(paymentId);
    if (!tx) throw new AppError(404, 'NOT_FOUND', 'Payment transaction not found');

    if (tx.status === 'REFUNDED') {
      return tx; // Idempotent return
    }

    if (tx.status !== 'SUCCESS') {
      throw new AppError(400, 'BAD_REQUEST', `Cannot refund payment in ${tx.status} state. Only SUCCESS payments can be refunded.`);
    }

    tx.status = 'REFUNDED';
    tx.refundReason = reason || 'Admin initiated refund';
    tx.refundedBy = new mongoose.Types.ObjectId(adminId);
    tx.refundedAt = new Date();
    await tx.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminId),
      action: 'PAYMENT_REFUNDED',
      entityType: 'PaymentTransaction',
      entityId: tx._id.toString()
    });

    return tx;
  }
}

