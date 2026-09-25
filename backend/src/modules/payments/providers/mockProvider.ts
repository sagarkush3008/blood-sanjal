import { IPaymentProvider } from './paymentProvider.interface';
import crypto from 'crypto';

export class MockPaymentProvider implements IPaymentProvider {
  async initiatePayment(transactionId: string, amountMinor: number, currency: string, purpose: string) {
    return {
      providerTransactionId: `MOCK-TX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      paymentUrl: `https://mock.gateway.local/pay/${transactionId}`,
      rawResponse: { initiatedAt: new Date() }
    };
  }

  async verifyPayment(gatewayTxId: string, expectedAmountMinor: number) {
    // In our mock, if gatewayTxId contains "FAIL", it fails. If "CANCEL", it cancels. If "MISMATCH", we fake amount mismatch.
    if (gatewayTxId.includes('FAIL')) {
      return { status: 'FAILED' as const, gatewayTxId };
    }
    if (gatewayTxId.includes('CANCEL')) {
      return { status: 'CANCELLED' as const, gatewayTxId };
    }
    if (gatewayTxId.includes('MISMATCH')) {
      // Simulate gateway reporting a different amount than expected (e.g. user tampered with request)
      return { status: 'FAILED' as const, gatewayTxId, rawResponse: { error: 'Amount mismatch', actualPaid: expectedAmountMinor - 100 } };
    }
    return { status: 'SUCCESS' as const, gatewayTxId };
  }
}
