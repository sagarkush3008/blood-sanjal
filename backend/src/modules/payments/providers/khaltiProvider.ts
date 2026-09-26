import { IPaymentProvider } from './paymentProvider.interface';

export class KhaltiPaymentProvider implements IPaymentProvider {
  private secretKey: string;

  constructor(secretKey = process.env.KHALTI_SECRET_KEY || 'live_secret_key_68791341fdd94846a146f0457ff7b455') {
    this.secretKey = secretKey;
  }

  async initiatePayment(transactionId: string, amountMinor: number, currency: string, purpose: string) {
    const pidx = `KHALTI-PIDX-${transactionId}`;
    return {
      providerTransactionId: pidx,
      paymentUrl: `https://test-pay.khalti.com/?pidx=${pidx}`,
      rawResponse: {
        pidx,
        payment_url: `https://test-pay.khalti.com/?pidx=${pidx}`,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
      }
    };
  }

  async verifyPayment(gatewayTxId: string, expectedAmountMinor: number, rawPayload?: any) {
    if (gatewayTxId.includes('FAIL')) {
      return { status: 'FAILED' as const, gatewayTxId, rawResponse: { reason: 'Khalti verification failed' } };
    }
    if (gatewayTxId.includes('CANCEL')) {
      return { status: 'CANCELLED' as const, gatewayTxId, rawResponse: { reason: 'Khalti payment cancelled by user' } };
    }

    if (rawPayload && rawPayload.status) {
      if (rawPayload.status === 'Completed') {
        return { status: 'SUCCESS' as const, gatewayTxId, rawResponse: rawPayload };
      } else if (rawPayload.status === 'User canceled') {
        return { status: 'CANCELLED' as const, gatewayTxId, rawResponse: rawPayload };
      }
    }

    return { status: 'SUCCESS' as const, gatewayTxId, rawResponse: { verifiedAt: new Date() } };
  }
}
