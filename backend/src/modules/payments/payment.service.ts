import { PaymentTransaction } from './payment.model';
import { feeConfig } from '../../config/fee.config';
import { AppError } from '../../core/errors/appError';
import { AuditLog } from '../audit/auditLog.model';

export class PaymentService {
  static async initiateSearchFee(userId: string) {
    if (!feeConfig.SEARCH_FEE_ENABLED) return { status: 'FREE' };
    
    const validFrom = new Date(Date.now() - feeConfig.SEARCH_FEE_VALIDITY_HOURS * 3600 * 1000);
    const existing = await PaymentTransaction.findOne({
      userId,
      purpose: 'SEARCH_FEE',
      status: 'COMPLETED',
      updatedAt: { $gte: validFrom }
    });

    if (existing) return { status: 'ALREADY_PAID', transactionId: existing._id };

    const tx = await PaymentTransaction.create({
      userId,
      amount: feeConfig.SEARCH_FEE_AMOUNT,
      purpose: 'SEARCH_FEE',
      currency: feeConfig.CURRENCY
    });

    return { 
      status: 'PENDING', 
      transactionId: tx._id, 
      amount: tx.amount, 
      currency: tx.currency,
      disclaimer: feeConfig.DISCLAIMER
    };
  }

  static async verifyTransaction(transactionId: string, gatewayTxId: string, userId: string) {
    const tx = await PaymentTransaction.findById(transactionId);
    if (!tx) throw new AppError(404, 'NOT_FOUND', 'Transaction not found');
    
    if (tx.userId.toString() !== userId) throw new AppError(403, 'FORBIDDEN', 'Transaction does not belong to you');

    if (tx.status === 'COMPLETED') {
      throw new AppError(409, 'CONFLICT', 'Transaction already completed. Replay attack prevented.');
    }
    
    const duplicate = await PaymentTransaction.findOne({ gatewayTransactionId: gatewayTxId });
    if (duplicate) throw new AppError(409, 'CONFLICT', 'Gateway transaction ID already used');

    // MOCK: Abstract Gateway verification would happen here

    tx.status = 'COMPLETED';
    tx.gatewayTransactionId = gatewayTxId;
    await tx.save();

    await AuditLog.create({
      actorId: userId,
      action: 'SEARCH_FEE_PAID',
      entityType: 'PaymentTransaction',
      entityId: tx._id.toString()
    });

    return tx;
  }

  static async hasValidSearchFee(userId: string) {
    if (!feeConfig.SEARCH_FEE_ENABLED) return true;
    
    const validFrom = new Date(Date.now() - feeConfig.SEARCH_FEE_VALIDITY_HOURS * 3600 * 1000);
    const existing = await PaymentTransaction.findOne({
      userId,
      purpose: 'SEARCH_FEE',
      status: 'COMPLETED',
      updatedAt: { $gte: validFrom }
    });
    
    return !!existing;
  }
}
