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

export async function sendCustomerMessage(input: SendCustomerMessageInput): Promise<CustomerMessageDeliveryResult> {
  const provider = providerName();

  if (provider === 'disabled') {
    console.warn('[customer-message] delivery disabled', { to: input.to, purpose: input.purpose });
    return { ok: false, provider, skipped: true };
  }

  if (provider === 'webhook') {
    return sendWebhookMessage(input);
  }

  console.info('[customer-message] development delivery', {
    to: input.to,
    purpose: input.purpose,
    message: input.message,
    metadata: input.metadata || {}
  });
  return { ok: true, provider: 'log' };
}
