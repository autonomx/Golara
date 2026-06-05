export const OUTBOUND_WEBHOOK_DELIVERY_STATUSES = [
  'planned',
  'queued',
  'sending',
  'accepted',
  'non_2xx',
  'timeout',
  'unavailable',
  'retry_wait',
  'cancelled',
  'dead_letter',
  'failed'
] as const;

export type OutboundWebhookDeliveryStatus = (typeof OUTBOUND_WEBHOOK_DELIVERY_STATUSES)[number];

export type OutboundWebhookDeliveryOutcomeCategory =
  | 'not_attempted'
  | 'accepted'
  | 'non_2xx'
  | 'timeout'
  | 'unavailable'
  | 'cancelled'
  | 'dead_letter'
  | 'failed';

export type OutboundWebhookDeliveryPlanInput = {
  configurationKey?: string | null;
  eventType?: string | null;
  eventRef?: string | null;
  payloadDigest?: string | null;
  idempotencyKey?: string | null;
  targetReady?: boolean;
  dispatcherEnabled?: boolean;
  attemptCount?: number | null;
  lastOutcomeCategory?: OutboundWebhookDeliveryOutcomeCategory | null;
};

export type OutboundWebhookDeliveryPlan = {
  configurationKey: string;
  eventType: string;
  eventRef: string;
  payloadDigest: string;
  idempotencyKey: string;
  status: OutboundWebhookDeliveryStatus;
  outcomeCategory: OutboundWebhookDeliveryOutcomeCategory;
  attemptCount: number;
  dispatcherEnabled: false;
  readyForFutureDispatch: boolean;
  blockers: string[];
  auditLabels: string[];
};

function normalizeToken(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || fallback;
}

function normalizeAttemptCount(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

function buildFallbackIdempotencyKey(input: {
  configurationKey: string;
  eventType: string;
  eventRef: string;
  payloadDigest: string;
}) {
  return [input.configurationKey, input.eventType, input.eventRef, input.payloadDigest].join(':');
}

function deriveStatus(input: {
  blockers: string[];
  attemptCount: number;
  outcomeCategory: OutboundWebhookDeliveryOutcomeCategory;
}) {
  if (input.blockers.length > 0) return 'planned';
  if (input.outcomeCategory === 'accepted') return 'accepted';
  if (input.outcomeCategory === 'non_2xx') return 'retry_wait';
  if (input.outcomeCategory === 'timeout') return 'retry_wait';
  if (input.outcomeCategory === 'unavailable') return 'retry_wait';
  if (input.outcomeCategory === 'cancelled') return 'cancelled';
  if (input.outcomeCategory === 'dead_letter') return 'dead_letter';
  if (input.outcomeCategory === 'failed') return 'failed';
  if (input.attemptCount > 0) return 'retry_wait';
  return 'planned';
}

export function buildOutboundWebhookDeliveryPlan(input: OutboundWebhookDeliveryPlanInput): OutboundWebhookDeliveryPlan {
  const configurationKey = normalizeToken(input.configurationKey, 'webhook-configuration-missing');
  const eventType = normalizeToken(input.eventType, 'webhook-event-missing');
  const eventRef = normalizeToken(input.eventRef, 'webhook-event-ref-missing');
  const payloadDigest = normalizeToken(input.payloadDigest, 'webhook-payload-digest-missing');
  const attemptCount = normalizeAttemptCount(input.attemptCount);
  const outcomeCategory = input.lastOutcomeCategory ?? 'not_attempted';

  const blockers: string[] = [];
  if (configurationKey === 'webhook-configuration-missing') blockers.push('configuration_key_missing');
  if (eventType === 'webhook-event-missing') blockers.push('event_type_missing');
  if (eventRef === 'webhook-event-ref-missing') blockers.push('event_ref_missing');
  if (payloadDigest === 'webhook-payload-digest-missing') blockers.push('payload_digest_missing');
  if (!input.targetReady) blockers.push('webhook_target_not_ready');
  if (input.dispatcherEnabled) blockers.push('dispatcher_must_remain_disabled_in_phase35_planning');

  const idempotencyKey = normalizeToken(
    input.idempotencyKey,
    buildFallbackIdempotencyKey({ configurationKey, eventType, eventRef, payloadDigest })
  );

  const status = deriveStatus({ blockers, attemptCount, outcomeCategory });

  const auditLabels = [
    `configuration:${configurationKey}`,
    `event:${eventType}`,
    `status:${status}`,
    `outcome:${outcomeCategory}`,
    `attempts:${attemptCount}`
  ];

  return {
    configurationKey,
    eventType,
    eventRef,
    payloadDigest,
    idempotencyKey,
    status,
    outcomeCategory,
    attemptCount,
    dispatcherEnabled: false,
    readyForFutureDispatch: blockers.length === 0 && status === 'planned',
    blockers,
    auditLabels
  };
}
