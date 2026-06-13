import { redactLogValue } from '@/lib/security/redacted-logging';

type AdminSecurityEventOutcome = 'success' | 'failure' | 'throttled' | 'unconfigured';

type AdminSecurityEventInput = {
  event: 'admin_login';
  outcome: AdminSecurityEventOutcome;
  reason?: string;
};

function safeReason(reason?: string) {
  const normalized = reason?.trim();
  if (!normalized) return undefined;
  return redactLogValue(normalized).slice(0, 160);
}

export function logAdminSecurityEvent(input: AdminSecurityEventInput) {
  const payload = {
    event: input.event,
    outcome: input.outcome,
    reason: safeReason(input.reason),
    at: new Date().toISOString()
  };

  const message = `[admin-security] ${input.event}:${input.outcome}`;
  if (input.outcome === 'success') {
    console.info(message, payload);
    return;
  }
  console.warn(message, payload);
}
