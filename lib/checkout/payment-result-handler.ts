import 'server-only';

import {
  checkoutAttemptStatusForResult,
  checkoutResultEventTitle,
  isDuplicateCheckoutResultEvent,
  nextCheckoutOrderStatus,
  normalizeCheckoutResultStatus,
  optionalCheckoutResultText,
  providerVerificationResult,
  shouldUpdateCheckoutAttemptStatus,
  type CheckoutProviderVerificationResult,
  type CheckoutResultStatus
} from '@/lib/checkout/payment-result-core';
import { hasDatabase, prisma } from '@/lib/prisma';

type CheckoutResultInput = {
  orderNumber: string;
  token: string;
  status: string;
  provider?: string;
  providerReference?: string;
  authority?: string;
};

type ZarinpalVerifyResponse = {
  data?: {
    code?: number;
    message?: string;
    card_hash?: string;
    card_pan?: string;
    ref_id?: number;
    fee_type?: string;
    fee?: number;
  };
  errors?: Record<string, unknown> | string[];
};

function zarinpalMerchantId() {
  return process.env.ZARINPAL_MERCHANT_ID?.trim();
}

function zarinpalVerifyUrl() {
  return process.env.ZARINPAL_VERIFY_URL?.trim() || 'https://payment.zarinpal.com/pg/v4/payment/verify.json';
}

function zarinpalAmount(amountCents: number) {
  const multiplier = Number.parseInt(process.env.ZARINPAL_AMOUNT_MULTIPLIER || '1', 10);
  return amountCents * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1);
}

async function verifyZarinpalPayment(input: { amountCents: number; authority?: string; status: CheckoutResultStatus }) {
  const authority = optionalCheckoutResultText(input.authority);
  const merchantId = zarinpalMerchantId();
  if (input.status !== 'paid') {
    return {
      status: input.status,
      providerReference: authority,
      metadata: { verificationSkipped: true, reason: 'provider-returned-non-paid' }
    } satisfies CheckoutProviderVerificationResult;
  }

  if (!merchantId || !authority) {
    return {
      status: 'failed',
      providerReference: authority,
      metadata: {
        verified: false,
        reason: !merchantId ? 'missing-merchant-id' : 'missing-authority'
      }
    } satisfies CheckoutProviderVerificationResult;
  }

  const response = await fetch(zarinpalVerifyUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: zarinpalAmount(input.amountCents),
      authority
    })
  });

  let payload: ZarinpalVerifyResponse | undefined;
  try {
    payload = (await response.json()) as ZarinpalVerifyResponse;
  } catch {
    payload = undefined;
  }

  const code = payload?.data?.code;
  const refId = payload?.data?.ref_id;
  const verified = response.ok && (code === 100 || code === 101) && typeof refId === 'number';
  return {
    status: verified ? 'paid' : 'failed',
    providerReference: refId ? String(refId) : authority,
    metadata: {
      verified,
      providerCode: code ?? 'missing',
      authority,
      refId: refId ?? '',
      cardHash: payload?.data?.card_hash ?? '',
      cardPan: payload?.data?.card_pan ?? '',
      fee: payload?.data?.fee ?? 0,
      feeType: payload?.data?.fee_type ?? '',
      httpStatus: response.status
    }
  } satisfies CheckoutProviderVerificationResult;
}

async function verifyProviderResult(input: { provider?: string; status: CheckoutResultStatus; providerReference?: string; authority?: string; amountCents: number }) {
  if (input.provider === 'zarinpal') {
    return verifyZarinpalPayment({
      amountCents: input.amountCents,
      authority: input.authority || input.providerReference,
      status: input.status
    });
  }

  return providerVerificationResult({
    provider: input.provider,
    status: input.status,
    providerReference: input.providerReference,
    requireVerification: process.env.CHECKOUT_REQUIRE_PROVIDER_VERIFICATION === 'true'
  });
}

export async function applyCheckoutResult(input: CheckoutResultInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout result handling.');

  const orderNumber = input.orderNumber.trim();
  const token = input.token.trim();
  if (!orderNumber || token.length < 16) throw new Error('Invalid order result reference.');

  const requestedStatus = normalizeCheckoutResultStatus(input.status);
  const providerReference = optionalCheckoutResultText(input.providerReference);
  const provider = optionalCheckoutResultText(input.provider);
  const authority = optionalCheckoutResultText(input.authority);
  const order = await prisma.checkoutOrder.findFirst({
    where: { orderNumber, publicLookupToken: token },
    include: {
      paymentAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      timelineEvents: {
        where: { type: 'payment_result' },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!order) throw new Error('Order result reference was not found.');

  const latestAttempt = order.paymentAttempts[0];
  const verification = await verifyProviderResult({
    provider: provider || latestAttempt?.provider,
    status: requestedStatus,
    providerReference: providerReference || latestAttempt?.providerReference || undefined,
    authority: authority || providerReference || latestAttempt?.providerReference || undefined,
    amountCents: latestAttempt?.amountCents ?? order.totalCents
  });
  const status = verification.status;
  const nextAttemptStatus = checkoutAttemptStatusForResult(status);
  let attemptChanged = false;

  if (latestAttempt && shouldUpdateCheckoutAttemptStatus(latestAttempt.status, nextAttemptStatus)) {
    await prisma.checkoutPaymentAttempt.update({
      where: { id: latestAttempt.id },
      data: {
        status: nextAttemptStatus,
        providerReference: verification.providerReference || latestAttempt.providerReference,
        metadata: {
          requestedStatus,
          resultStatus: status,
          provider: provider || latestAttempt.provider,
          providerReference: verification.providerReference || latestAttempt.providerReference || '',
          source: 'checkout-result-handler',
          ...(verification.metadata ?? {})
        }
      }
    });
    attemptChanged = true;
  }

  const updatedOrderStatus = nextCheckoutOrderStatus(order.status, status);
  const statusChanged = updatedOrderStatus !== order.status;
  const lastEvent = order.timelineEvents[0];
  const duplicateLatestEvent = isDuplicateCheckoutResultEvent({ lastEvent, status });

  if (statusChanged || attemptChanged || !duplicateLatestEvent) {
    await prisma.checkoutOrder.update({
      where: { id: order.id },
      data: {
        status: updatedOrderStatus,
        timelineEvents: duplicateLatestEvent
          ? undefined
          : {
              create: {
                type: 'payment_result',
                title: checkoutResultEventTitle(status),
                metadata: {
                  requestedStatus,
                  resultStatus: status,
                  provider: provider || latestAttempt?.provider || '',
                  providerReference: verification.providerReference || '',
                  idempotent: !attemptChanged && !statusChanged,
                  ...(verification.metadata ?? {})
                }
              }
            }
      }
    });
  }

  return {
    orderNumber: order.orderNumber,
    publicLookupToken: order.publicLookupToken,
    status,
    orderStatus: updatedOrderStatus,
    attemptChanged,
    timelineChanged: !duplicateLatestEvent
  };
}
