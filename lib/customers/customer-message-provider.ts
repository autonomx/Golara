import 'server-only';

type SendCustomerMessageInput = {
  to: string;
  purpose: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
};

export type CustomerMessageDeliveryResult = {
  ok: boolean;
  provider: string;
  reference?: string;
  skipped?: boolean;
};

type KavenegarResponse = {
  return?: {
    status?: number;
    message?: string;
  };
  entries?: Array<{
    messageid?: number | string;
    status?: number;
    statustext?: string;
  }>;
};

function providerName() {
  return (process.env.CUSTOMER_MESSAGE_PROVIDER || process.env.CUSTOMER_OTP_DELIVERY_PROVIDER || 'log').trim().toLowerCase();
}

async function sendWebhookMessage(input: SendCustomerMessageInput): Promise<CustomerMessageDeliveryResult> {
  const endpoint = process.env.CUSTOMER_MESSAGE_WEBHOOK_URL;
  if (!endpoint) return { ok: false, provider: 'webhook', skipped: true };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.CUSTOMER_MESSAGE_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.CUSTOMER_MESSAGE_WEBHOOK_TOKEN}` } : {})
    },
    body: JSON.stringify({
      to: input.to,
      purpose: input.purpose,
      message: input.message,
      metadata: input.metadata || {}
    })
  });

  return {
    ok: response.ok,
    provider: 'webhook',
    reference: response.headers.get('x-request-id') || undefined
  };
}

function kavenegarEndpoint(apiKey: string) {
  const baseUrl = (process.env.KAVENEGAR_BASE_URL || 'https://api.kavenegar.com').replace(/\/$/, '');
  return `${baseUrl}/v1/${encodeURIComponent(apiKey)}/sms/send.json`;
}

function kavenegarReference(payload: KavenegarResponse) {
  const messageId = payload.entries?.[0]?.messageid;
  return messageId === undefined || messageId === null ? undefined : String(messageId);
}

async function sendKavenegarMessage(input: SendCustomerMessageInput): Promise<CustomerMessageDeliveryResult> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const sender = process.env.KAVENEGAR_SENDER;
  if (!apiKey) return { ok: false, provider: 'kavenegar', skipped: true };

  const body = new URLSearchParams({
    receptor: input.to,
    message: input.message
  });
  if (sender) body.set('sender', sender);

  const response = await fetch(kavenegarEndpoint(apiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

  let payload: KavenegarResponse = {};
  try {
    payload = await response.json() as KavenegarResponse;
  } catch {
    payload = {};
  }

  const providerAccepted = payload.return?.status === 200;
  return {
    ok: response.ok && providerAccepted,
    provider: 'kavenegar',
    reference: kavenegarReference(payload)
  };
}

export async function sendCustomerMessage(input: SendCustomerMessageInput): Promise<CustomerMessageDeliveryResult> {
  const provider = providerName();

  if (provider === 'disabled') {
    console.warn('[customer-message] delivery disabled', { to: input.to, purpose: input.purpose });
    return { ok: false, provider, skipped: true };
  }

  if (provider === 'webhook') {
    return sendWebhookMessage(input);
  }

  if (provider === 'kavenegar') {
    return sendKavenegarMessage(input);
  }

  console.info('[customer-message] development delivery', {
    to: input.to,
    purpose: input.purpose,
    message: input.message,
    metadata: input.metadata || {}
  });
  return { ok: true, provider: 'log' };
}
