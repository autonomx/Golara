import { redactLogValue } from '@/lib/security/redacted-logging';
import type { AdminRole } from '@/lib/admin-auth-core';

type AdminSecurityEventOutcome = 'success' | 'failure' | 'throttled' | 'unconfigured' | 'denied';

type AdminSecurityEventInput =
  | {
      event: 'admin_login';
      outcome: Exclude<AdminSecurityEventOutcome, 'denied'>;
      reason?: string;
    }
  | {
      event: 'admin_authorization';
      outcome: 'denied';
      reason?: string;
      requiredRole?: AdminRole;
      actualRole?: AdminRole;
      authenticated?: boolean;
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
    ...(input.event === 'admin_authorization'
      ? {
          authenticated: input.authenticated,
          requiredRole: input.requiredRole,
          actualRole: input.actualRole
        }
      : {}),
    at: new Date().toISOString()
  };

  const message = `[admin-security] ${input.event}:${input.outcome}`;
  if (input.outcome === 'success') {
    console.info(message, payload);
    return;
  }
  console.warn(message, payload);
}
