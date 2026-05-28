import { createHash, createHmac } from 'node:crypto';

export type CustomerAuthIdentifierKind = 'phone' | 'ip' | 'user-agent';

const PERSIAN_DIGITS: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => PERSIAN_DIGITS[digit] ?? digit);
}

export function normalizePhoneForAuth(value: string) {
  const normalized = normalizeDigits(value).trim();
  const startsWithPlus = normalized.startsWith('+');
  const digits = normalized.replace(/[^0-9]/g, '');

  if (!digits) return '';
  if (startsWithPlus) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return digits;
}

export function normalizeIpForAuth(value: string | undefined | null) {
  const first = value?.split(',')[0]?.trim().toLowerCase();
  return first || '';
}

export function normalizeUserAgentForAuth(value: string | undefined | null) {
  return value?.trim().replace(/\s+/g, ' ') || '';
}

export function hashCustomerAuthIdentifier(kind: CustomerAuthIdentifierKind, normalizedValue: string, secret = process.env.CUSTOMER_AUTH_HASH_SECRET) {
  if (!normalizedValue) return '';
  const payload = `${kind}:${normalizedValue}`;

  if (secret?.trim()) {
    return createHmac('sha256', secret.trim()).update(payload).digest('hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CUSTOMER_AUTH_HASH_SECRET is required to hash customer auth identifiers in production.');
  }

  return createHash('sha256').update(`dev-only:${payload}`).digest('hex');
}

export function hashCustomerAuthPhone(value: string, secret?: string) {
  return hashCustomerAuthIdentifier('phone', normalizePhoneForAuth(value), secret);
}

export function hashCustomerAuthIp(value: string | undefined | null, secret?: string) {
  return hashCustomerAuthIdentifier('ip', normalizeIpForAuth(value), secret);
}

export function hashCustomerAuthUserAgent(value: string | undefined | null, secret?: string) {
  return hashCustomerAuthIdentifier('user-agent', normalizeUserAgentForAuth(value), secret);
}
