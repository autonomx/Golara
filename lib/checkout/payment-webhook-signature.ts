import { createHmac, timingSafeEqual } from 'node:crypto';

export type PaymentWebhookSignatureProvider = 'stripe' | 'zarinpal';

export type PaymentWebhookSignatureResult = {
  ok: boolean;
  enforced: boolean;
  provider: PaymentWebhookSignatureProvider;
  reason: 'valid' | 'not_configured' | 'missing_signature' | 'invalid_signature' | 'unsupported_provider';
};

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function headerValue(headers: Record<string, string | string[] | undefined> | undefined, name: string) {
  if (!headers) return undefined;
  const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (Array.isArray(direct)) return direct[0];
  return optionalText(direct);
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export function stripeWebhookSecret() {
  return optionalText(process.env.STRIPE_WEBHOOK_SECRET);
}

export function zarinpalWebhookSecret() {
  return optionalText(process.env.ZARINPAL_WEBHOOK_SECRET);
}

export function stripeSignaturePayload(input: { rawBody: string; signatureHeader?: string }) {
  const signature = optionalText(input.signatureHeader);
  if (!signature) return undefined;
  const timestamp = signature.split(',').find((part) => part.startsWith('t='))?.slice(2);
  const signedPayload = timestamp ? `${timestamp}.${input.rawBody}` : input.rawBody;
  return { signature, signedPayload };
}

export function expectedWebhookSignature(input: { provider: PaymentWebhookSignatureProvider; rawBody: string; secret: string; signatureHeader?: string }) {
  const payload = input.provider === 'stripe'
    ? stripeSignaturePayload({ rawBody: input.rawBody, signatureHeader: input.signatureHeader })?.signedPayload ?? input.rawBody
    : input.rawBody;
  return createHmac('sha256', input.secret).update(payload).digest('hex');
}

export function verifyPaymentWebhookSignature(input: {
  provider: PaymentWebhookSignatureProvider;
  rawBody: string;
  headers?: Record<string, string | string[] | undefined>;
  secret?: string;
  enforce?: boolean;
}): PaymentWebhookSignatureResult {
  const configuredSecret = optionalText(input.secret) ?? (input.provider === 'stripe' ? stripeWebhookSecret() : zarinpalWebhookSecret());
  const enforced = input.enforce ?? Boolean(configuredSecret);

  if (!configuredSecret) {
    return { ok: !enforced, enforced, provider: input.provider, reason: 'not_configured' };
  }

  const signatureHeader = input.provider === 'stripe'
    ? headerValue(input.headers, 'stripe-signature')
    : headerValue(input.headers, 'x-zarinpal-signature') ?? headerValue(input.headers, 'x-golara-signature');
  if (!signatureHeader) {
    return { ok: false, enforced, provider: input.provider, reason: 'missing_signature' };
  }

  const expected = expectedWebhookSignature({
    provider: input.provider,
    rawBody: input.rawBody,
    secret: configuredSecret,
    signatureHeader
  });
  const candidate = input.provider === 'stripe'
    ? signatureHeader.split(',').find((part) => part.startsWith('v1='))?.slice(3)
    : signatureHeader;

  if (!candidate || !safeEqualHex(candidate, expected)) {
    return { ok: false, enforced, provider: input.provider, reason: 'invalid_signature' };
  }

  return { ok: true, enforced, provider: input.provider, reason: 'valid' };
}
