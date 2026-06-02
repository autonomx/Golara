import type { AdminRole } from '@/lib/admin-auth-core';

export type CustomerSensitiveFieldPolicy = {
  canRevealSensitive: boolean;
  revealSensitive: boolean;
  sensitiveFieldsMasked: boolean;
};

export function createCustomerSensitiveFieldPolicy(role: AdminRole, requestedReveal: boolean): CustomerSensitiveFieldPolicy {
  const canRevealSensitive = role === 'owner';
  const revealSensitive = canRevealSensitive && requestedReveal;

  return {
    canRevealSensitive,
    revealSensitive,
    sensitiveFieldsMasked: !revealSensitive
  };
}

function maskMiddle(value: string, leading: number, trailing: number) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length <= leading + trailing) return '*'.repeat(Math.max(trimmed.length, 4));
  return `${trimmed.slice(0, leading)}${'*'.repeat(6)}${trimmed.slice(-trailing)}`;
}

export function maskSensitiveIdentifier(value: string | null | undefined) {
  if (!value) return value;
  return maskMiddle(value, 3, 4);
}

export function maskSensitivePhone(value: string | null | undefined) {
  if (!value) return value;
  const leading = value.trim().startsWith('+') ? 3 : 1;
  return maskMiddle(value, leading, 4);
}

export function maskSensitiveEmail(value: string | null | undefined) {
  if (!value) return value;
  const [local, domain] = value.trim().split('@');
  if (!local || !domain) return maskSensitiveIdentifier(value);

  const [domainName, ...domainRest] = domain.split('.');
  const maskedLocal = `${local.slice(0, 1)}${'*'.repeat(5)}`;
  const maskedDomain = `${domainName.slice(0, 1)}${'*'.repeat(4)}`;
  return `${maskedLocal}@${[maskedDomain, ...domainRest].join('.')}`;
}

export function maskSensitiveNote(value: string | null | undefined) {
  if (!value) return value;
  return '[masked sensitive note]';
}
