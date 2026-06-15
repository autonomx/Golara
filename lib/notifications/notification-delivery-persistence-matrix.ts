export const NOTIFICATION_DELIVERY_ATTEMPT_FIELDS = [
  'id',
  'channel',
  'scenario',
  'recipientKind',
  'recipientRef',
  'providerMode',
  'providerName',
  'templateKey',
  'idempotencyKey',
  'status',
  'attemptCount',
  'lastOutcomeCategory',
  'nextEligibleAttemptAt',
  'lastProviderReference',
  'createdAt',
  'updatedAt'
] as const;

export type NotificationDeliveryAttemptField = (typeof NOTIFICATION_DELIVERY_ATTEMPT_FIELDS)[number];

export const NOTIFICATION_DELIVERY_ATTEMPT_STATUSES = [
  'planned',
  'skipped',
  'manual_required',
  'logged',
  'queued',
  'sending',
  'accepted',
  'rejected',
  'rate_limited',
  'unavailable',
  'failed',
  'suppressed'
] as const;

export type NotificationDeliveryAttemptStatus = (typeof NOTIFICATION_DELIVERY_ATTEMPT_STATUSES)[number];

export const NOTIFICATION_DELIVERY_OUTCOME_CATEGORIES = [
  'accepted',
  'rejected',
  'rate_limited',
  'unavailable',
  'suppressed',
  'skipped',
  'failed'
] as const;

export type NotificationDeliveryOutcomeCategory = (typeof NOTIFICATION_DELIVERY_OUTCOME_CATEGORIES)[number];

export const NOTIFICATION_DELIVERY_IDEMPOTENCY_COMPONENTS = [
  'channel',
  'scenario',
  'businessObjectType',
  'businessObjectId',
  'recipientKind',
  'recipientRef',
  'templateKey',
  'environmentName'
] as const;

export type NotificationDeliveryIdempotencyComponent =
  (typeof NOTIFICATION_DELIVERY_IDEMPOTENCY_COMPONENTS)[number];

export type NotificationDeliveryPersistenceRequirement = {
  id: string;
  title: string;
  requiredFields: NotificationDeliveryAttemptField[];
  statuses: NotificationDeliveryAttemptStatus[];
  privacyControls: string[];
  evidenceRequired: string[];
  liveDeliveryEnabled: false;
};

export function buildNotificationDeliveryPersistenceMatrix(): NotificationDeliveryPersistenceRequirement[] {
  return [
    {
      id: 'notification-attempt-record-shape',
      title: 'Delivery-attempt record contains only safe operational metadata',
      requiredFields: [...NOTIFICATION_DELIVERY_ATTEMPT_FIELDS],
      statuses: ['planned', 'skipped', 'manual_required', 'logged', 'queued'],
      privacyControls: [
        'store_recipient_ref_not_raw_secret_or_provider_payload',
        'store_template_key_not_rendered_message_body',
        'store_safe_provider_reference_only'
      ],
      evidenceRequired: [
        'schema_or_migration_review',
        'privacy_minimization_review',
        'retention_policy_review'
      ],
      liveDeliveryEnabled: false
    },
    {
      id: 'notification-idempotency-contract',
      title: 'Idempotency key prevents duplicate customer or staff sends',
      requiredFields: ['idempotencyKey', 'channel', 'scenario', 'recipientKind', 'recipientRef', 'templateKey'],
      statuses: ['planned', 'queued', 'sending', 'accepted', 'failed'],
      privacyControls: [
        'deterministic_key_without_secret_values',
        'same_logical_notification_reuses_key',
        'business_state_change_requires_new_template_or_scenario_key'
      ],
      evidenceRequired: [
        'idempotency_key_shape_review',
        'duplicate_send_prevention_test',
        'retry_reuse_test'
      ],
      liveDeliveryEnabled: false
    },
    {
      id: 'notification-worker-boundary',
      title: 'Worker/retry behavior remains separate from persistence planning',
      requiredFields: ['status', 'attemptCount', 'nextEligibleAttemptAt', 'lastOutcomeCategory'],
      statuses: ['queued', 'sending', 'rate_limited', 'unavailable', 'failed'],
      privacyControls: [
        'no_worker_without_live_enablement_gate',
        'no_admin_retry_control_before_attempt_persistence',
        'terminal_failure_visible_without_raw_payloads'
      ],
      evidenceRequired: [
        'worker_locking_design_review',
        'retry_backoff_policy_review',
        'dead_letter_visibility_review'
      ],
      liveDeliveryEnabled: false
    },
    {
      id: 'notification-suppression-retention-boundary',
      title: 'Suppression, opt-out, and retention rules are decided before live sends',
      requiredFields: ['recipientKind', 'recipientRef', 'status', 'lastOutcomeCategory', 'updatedAt'],
      statuses: ['suppressed', 'skipped', 'manual_required', 'failed'],
      privacyControls: [
        'consent_or_suppression_policy_reviewed',
        'retention_window_defined_before_live_delivery',
        'customer_deletion_redaction_behavior_defined'
      ],
      evidenceRequired: [
        'consent_suppression_review',
        'retention_window_approval',
        'privacy_request_redaction_review'
      ],
      liveDeliveryEnabled: false
    }
  ];
}

export function summarizeNotificationDeliveryPersistenceReadiness() {
  const matrix = buildNotificationDeliveryPersistenceMatrix();
  return {
    liveDeliveryEnabled: false as const,
    requirementCount: matrix.length,
    requiredFieldCount: NOTIFICATION_DELIVERY_ATTEMPT_FIELDS.length,
    statusCount: NOTIFICATION_DELIVERY_ATTEMPT_STATUSES.length,
    idempotencyComponentCount: NOTIFICATION_DELIVERY_IDEMPOTENCY_COMPONENTS.length,
    blockerReasons: [
      'delivery_attempt_migration_not_applied',
      'provider_evidence_not_confirmed',
      'notification_smoke_tests_not_confirmed',
      'delivery_persistence_not_confirmed'
    ]
  };
}
