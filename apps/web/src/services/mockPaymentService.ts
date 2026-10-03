import { PaymentRecord } from '../types';

export interface PaymentRequest {
  userId?: string;
  userName?: string;
  amount: number;
  currency: string;
}

export class MockPaymentService {
  static async processPayment(req: PaymentRequest): Promise<PaymentRecord> {
    return { 
      id: 'txn_' + Date.now(),
      userId: req.userId || 'unknown',
      amount: req.amount,
      status: 'completed',
      date: new Date().toISOString(),
      transactionId: 'txn_' + Date.now()
    };
  }
}
