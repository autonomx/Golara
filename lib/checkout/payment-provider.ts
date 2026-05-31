import 'server-only';

import { mapCheckoutAttemptStatus } from '@/lib/checkout/checkout-attempt-status';
import { checkoutCurrency } from '@/lib/checkout/payment-attempt-core';
import { initiatePaymentGateway } from '@/lib/checkout/payment-gateway-adapters';
import {
  isAdapterPaymentProviderName,
  mapAliasGatewayResultToLegacyAttempt,
  normalizeCheckoutProviderName
} from '@/lib/checkout/payment-provider-alias-core';
import { hasDatabase, prisma } from '@/lib/prisma';

export type PaymentProviderName = 'manual' | 'domestic_redirect' | 'zarinpal' | 'iranian' | 'stripe' | 'whatsapp' | 'inquiry';
type LegacyPaymentProviderName = 'manual' | 'domestic_redirect' | 'zarinpal';

type CreatePaymentAttemptInput = {
  orderId: string;
  provider?: PaymentProviderName;
};

type PaymentMetadata = Record<string, string | number | boolean | string[]>;

type PaymentProviderResult = {
  provider: PaymentProviderName;
  status: 'manual_pending' | 'created' | 'redirect_required';
  providerReference?: string;
  redirectUrl?: string;
  metadata?: PaymentMetadata;
};

type PaymentProviderOrder = {
  id: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  publicLookupToken?: string | null;
};

type PaymentProvider = {
  name: LegacyPaymentProviderName;
  createAttempt(order: PaymentProviderOrder): Promise<PaymentProviderResult>;
};

type ZarinpalRequestResponse = {
  data?: {
    code?: number;
    message?: string;
    authority?: string;
    fee_type?: string;
    fee?: number;
  };
  errors?: Record<string, unknown> | string[];
};

function configuredPaymentProvider(): PaymentProviderName {
  const provider = process.env.CHECKOUT_DOMESTIC_GATEWAY_PROVIDER?.trim().toLowerCase() || 'manual';
  return normalizeCheckoutProviderName(provider);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || '';
}

function zarinpalRequestUrl() {
  return process.env.ZARINPAL_REQUEST_URL?.trim() || 'https://payment.zarinpal.com/pg/v4/payment/request.json';
}

function zarinpalStartUrl() {
  return process.env.ZARINPAL_START_URL?.trim().replace(/\/$/, '') || 'https://payment.zarinpal.com/pg/StartPay';
}

function zarinpalMerchantId() {
  return process.env.ZARINPAL_MERCHANT_ID?.trim();
}

function zarinpalAmount(order: PaymentProviderOrder) {
  const multiplier = Number.parseInt(process.env.ZARINPAL_AMOUNT_MULTIPLIER || '1', 10);
  return order.totalCents * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1);
}

function checkoutReturnUrl(order: PaymentProviderOrder, provider?: PaymentProviderName) {
  if (!order.publicLookupToken || !siteUrl()) return undefined;
  const returnUrl = new URL(`${siteUrl()}/orders/return`);
  returnUrl.searchParams.set('order', order.orderNumber);
  returnUrl.searchParams.set('token', order.publicLookupToken);
  if (provider) returnUrl.searchParams.set('provider', provider);
  return returnUrl.toString();
}

const manualPaymentProvider: PaymentProvider = {
  name: 'manual',
  async createAttempt(order) {
    return {
      provider: 'manual',
      status: mapCheckoutAttemptStatus('manual'),
      providerReference: order.orderNumber,
      metadata: {
        instruction: 'Manual staff follow-up required',
        orderNumber: order.orderNumber
      }
    };
  }
};

const domesticRedirectProvider: PaymentProvider = {
  name: 'domestic_redirect',
  async createAttempt(order) {
    const baseUrl = process.env.CHECKOUT_DOMESTIC_GATEWAY_START_URL?.trim();
    if (!baseUrl) {
      const metadata: PaymentMetadata = {
        instruction: 'Domestic redirect URL is not configured; manual staff follow-up required',
        orderNumber: order.orderNumber
      };
      return {
        provider: 'domestic_redirect',
        status: mapCheckoutAttemptStatus('manual'),
        providerReference: order.orderNumber,
        metadata
      };
    }

    const url = new URL(baseUrl);
    url.searchParams.set('order', order.orderNumber);
    url.searchParams.set('amount', String(order.totalCents));
    url.searchParams.set('currency', order.currency);
    const returnUrl = checkoutReturnUrl(order, 'domestic_redirect');
    if (returnUrl) url.searchParams.set('callback', returnUrl);

    const metadata: PaymentMetadata = {
      orderNumber: order.orderNumber,
      configuredUrl: baseUrl
    };
    return {
      provider: 'domestic_redirect',
      status: mapCheckoutAttemptStatus('redirect'),
      providerReference: order.orderNumber,
      redirectUrl: url.toString(),
      metadata
    };
  }
};

const zarinpalPaymentProvider: PaymentProvider = {
  name: 'zarinpal',
  async createAttempt(order): Promise<PaymentProviderResult> {
    const merchantId = zarinpalMerchantId();
    const callbackUrl = checkoutReturnUrl(order, 'zarinpal');
    if (!merchantId || !callbackUrl) {
      const metadata: PaymentMetadata = {
        instruction: 'Zarinpal is not fully configured; manual staff follow-up required',
        missingMerchantId: !merchantId,
        missingCallbackUrl: !callbackUrl,
        orderNumber: order.orderNumber
      };
      return {
        provider: 'zarinpal',
        status: mapCheckoutAttemptStatus('manual'),
        providerReference: order.orderNumber,
        metadata
      };
    }

    const amount = zarinpalAmount(order);
    const response = await fetch(zarinpalRequestUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount,
        callback_url: callbackUrl,
        description: process.env.ZARINPAL_DESCRIPTION?.trim() || `Golara order ${order.orderNumber}`,
        metadata: {
          order_number: order.orderNumber
        }
      })
    });

    let payload: ZarinpalRequestResponse | undefined;
    try {
      payload = (await response.json()) as ZarinpalRequestResponse;
    } catch {
      payload = undefined;
    }

    const authority = payload?.data?.authority;
    const code = payload?.data?.code;
    if (!response.ok || code !== 100 || !authority) {
      console.warn('[checkout] zarinpal request failed', { status: response.status, code, errors: payload?.errors });
      const metadata: PaymentMetadata = {
        instruction: 'Zarinpal payment request failed; manual staff follow-up required',
        orderNumber: order.orderNumber,
        httpStatus: response.status,
        providerCode: code ?? 'missing'
      };
      return {
        provider: 'zarinpal',
        status: mapCheckoutAttemptStatus('manual'),
        providerReference: order.orderNumber,
        metadata
      };
    }

    const metadata: PaymentMetadata = {
      orderNumber: order.orderNumber,
      providerCode: code,
      authority,
      amount,
      fee: payload?.data?.fee ?? 0,
      feeType: payload?.data?.fee_type ?? ''
    };
    return {
      provider: 'zarinpal',
      status: mapCheckoutAttemptStatus('redirect'),
      providerReference: authority,
      redirectUrl: `${zarinpalStartUrl()}/${authority}`,
      metadata
    };
  }
};

function getPaymentProvider(provider?: PaymentProviderName): PaymentProvider {
  const selected = provider || configuredPaymentProvider();
  if (selected === 'domestic_redirect') return domesticRedirectProvider;
  if (selected === 'zarinpal') return zarinpalPaymentProvider;
  return manualPaymentProvider;
}

async function createAdapterAliasAttempt(order: PaymentProviderOrder, provider: Extract<PaymentProviderName, 'iranian' | 'stripe' | 'whatsapp' | 'inquiry'>): Promise<PaymentProviderResult> {
  const result = await initiatePaymentGateway({
    provider,
    payment: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountCents: order.totalCents,
      currency: checkoutCurrency(order.currency),
      returnUrl: checkoutReturnUrl(order, provider) ?? siteUrl(),
      metadata: {
        orderNumber: order.orderNumber
      }
    }
  });
  return mapAliasGatewayResultToLegacyAttempt({ result: { ...result, provider }, order });
}

export async function createCheckoutPaymentAttempt(input: CreatePaymentAttemptInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout payment attempts.');

  const order = await prisma.checkoutOrder.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      orderNumber: true,
      totalCents: true,
      currency: true,
      status: true,
      publicLookupToken: true
    }
  });

  if (!order) throw new Error('Order draft not found.');
  if (order.totalCents <= 0) throw new Error('Order total must be greater than zero before payment.');
  if (!['draft', 'pending_payment'].includes(order.status)) {
    throw new Error('Order is not eligible for payment.');
  }

  const selectedProvider = normalizeCheckoutProviderName(input.provider ?? configuredPaymentProvider());
  const result = isAdapterPaymentProviderName(selectedProvider)
    ? await createAdapterAliasAttempt(order, selectedProvider)
    : await getPaymentProvider(selectedProvider).createAttempt(order);

  const attemptData = {
    orderId: order.id,
    provider: result.provider,
    status: result.status,
    amountCents: order.totalCents,
    currency: order.currency,
    ...(result.providerReference ? { providerReference: result.providerReference } : {}),
    ...(result.redirectUrl ? { redirectUrl: result.redirectUrl } : {}),
    ...(result.metadata ? { metadata: result.metadata } : {})
  };

  const attempt = await prisma.checkoutPaymentAttempt.create({
    data: attemptData
  });

  await prisma.checkoutOrder.update({
    where: { id: order.id },
    data: { status: 'pending_payment' }
  });

  return attempt;
}
