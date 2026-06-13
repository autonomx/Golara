import { redactLogValue } from '@/lib/security/redacted-logging';

type PublicAbuseEventType = 'public_order_lookup' | 'public_inquiry' | 'cart_mutation';
type PublicAbuseEventOutcome = 'throttled' | 'cooldown_active';
type PublicAbuseEventScope = 'lookup' | 'inquiry' | 'add_cart_item' | 'update_cart_item' | 'clear_cart';

type PublicAbuseEventInput = {
  event: PublicAbuseEventType;
  outcome: PublicAbuseEventOutcome;
  scope?: PublicAbuseEventScope;
  reason?: string;
};

function safeText(value?: string, maxLength = 120) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return redactLogValue(normalized).slice(0, maxLength);
}

export function logPublicAbuseEvent(input: PublicAbuseEventInput) {
  const payload = {
    event: input.event,
    outcome: input.outcome,
    scope: input.scope,
    reason: safeText(input.reason, 160),
    at: new Date().toISOString()
  };

  console.warn(`[public-abuse] ${input.event}:${input.outcome}`, payload);
}
