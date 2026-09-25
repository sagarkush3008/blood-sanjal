export interface IPaymentProvider {
  initiatePayment(transactionId: string, amountMinor: number, currency: string, purpose: string): Promise<{
    providerTransactionId?: string;
    paymentUrl?: string;
    rawResponse?: any;
  }>;

  verifyPayment(gatewayTxId: string, expectedAmountMinor: number): Promise<{
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
    gatewayTxId: string;
    rawResponse?: any;
  }>;
}
