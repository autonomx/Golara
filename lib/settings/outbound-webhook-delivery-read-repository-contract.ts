export type OutboundWebhookDeliveryReadRepositoryField =
  | 'id'
  | 'configurationKey'
  | 'eventType'
  | 'eventRef'
  | 'payloadDigest'
  | 'idempotencyKey'
  | 'status'
  | 'attemptCount'
  | 'lastOutcomeCategory'
  | 'nextEligibleAttemptAt'
  | 'lastResponseCode'
  | 'deadLetterSummary'
  | 'createdAt'
  | 'updatedAt';

export type OutboundWebhookDeliveryReadRepositoryOperation =
  | 'list_deliveries'
  | 'get_delivery_detail'
  | 'count_deliveries';

export type OutboundWebhookDeliveryReadRepositoryContract = {
  tableName: 'OutboundWebhookDelivery';
  storageReadyForRuntime: false;
  readRepositoryImplemented: false;
  writeRepositoryImplemented: false;
  allowedOperations: OutboundWebhookDeliveryReadRepositoryOperation[];
  selectedFields: OutboundWebhookDeliveryReadRepositoryField[];
  redactedFields: string[];
  deferredCapabilities: string[];
  auditLabels: string[];
};

const selectedFields: OutboundWebhookDeliveryReadRepositoryField[] = [
  'id',
  'configurationKey',
  'eventType',
  'eventRef',
  'payloadDigest',
  'idempotencyKey',
  'status',
  'attemptCount',
  'lastOutcomeCategory',
  'nextEligibleAttemptAt',
  'lastResponseCode',
  'deadLetterSummary',
  'createdAt',
  'updatedAt'
];

export function buildOutboundWebhookDeliveryReadRepositoryContract(): OutboundWebhookDeliveryReadRepositoryContract {
  return {
    tableName: 'OutboundWebhookDelivery',
    storageReadyForRuntime: false,
    readRepositoryImplemented: false,
    writeRepositoryImplemented: false,
    allowedOperations: ['list_deliveries', 'get_delivery_detail', 'count_deliveries'],
    selectedFields,
    redactedFields: ['rawPayload', 'signingSecret', 'receiverResponseBody', 'requestHeaders'],
    deferredCapabilities: [
      'prisma_model_alignment',
      'repository_implementation',
      'route_handlers',
      'admin_pages',
      'dispatcher_execution',
      'retry_execution',
      'signing_runtime',
      'recovery_controls',
      'live_delivery'
    ],
    auditLabels: [
      'read-contract:planned',
      'storage-runtime:disabled',
      'repository-reads:pending',
      'repository-writes:disabled',
      'redaction:required',
      'external-calls:disabled'
    ]
  };
}
