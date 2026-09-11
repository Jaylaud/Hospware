import crypto from 'node:crypto';

export class PaystackWebhookHandler {
  /**
   * Validates Paystack HMAC SHA512 signature from x-paystack-signature header.
   */
  public static verifySignature(rawBody: string, signature: string, secretKey: string): boolean {
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Processes charge.success webhook event
   */
  public static processEvent(eventData: {
    event: string;
    data: {
      reference: string;
      amount: number; // in lowest currency unit (e.g. kobo/pesewas)
      currency: string;
      customer: { email: string; phone?: string };
      metadata?: { reservationId?: string; propertyId?: string };
    };
  }) {
    if (eventData.event === 'charge.success') {
      const amountDecimal = eventData.data.amount / 100;
      return {
        success: true,
        reference: eventData.data.reference,
        amount: amountDecimal,
        currency: eventData.data.currency,
        reservationId: eventData.data.metadata?.reservationId,
        propertyId: eventData.data.metadata?.propertyId,
      };
    }

    return { success: false };
  }
}
