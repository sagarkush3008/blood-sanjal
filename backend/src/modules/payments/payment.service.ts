import { PaymentTransaction } from './payment.model';
import { feeConfig } from '../../config/fee.config';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';
import { MockPaymentProvider } from './providers/mockProvider';

const paymentProvider = new MockPaymentProvider();

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

    const initData = await paymentProvider.initiatePayment(tx._id.toString(), tx.amountMinor, tx.currency, tx.purpose);

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

  static async handleWebhook(gatewayTxId: string) {
    const tx = await PaymentTransaction.findOne({ gatewayTransactionId: gatewayTxId });
    if (!tx) throw new AppError(404, 'NOT_FOUND', 'Transaction not found');
    
    if (tx.status === 'SUCCESS') {
      return tx; // Idempotent success
    }

    const verification = await paymentProvider.verifyPayment(gatewayTxId, tx.amountMinor);

    tx.status = verification.status;
    tx.metadata = { ...tx.metadata, webhookRaw: verification.rawResponse };
    await tx.save();

    if (tx.status === 'SUCCESS') {
      await AuditLog.create({
        actorId: tx.userId,
        action: 'SEARCH_PLATFORM_FEE_PAID',
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

  static async getAdminPaymentReport(filters: any = {}) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.purpose) query.purpose = filters.purpose;
    
    return PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');
  }
}
