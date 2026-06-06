import { buildOutboundWebhookDeliveryReadRepositoryContract } from './outbound-webhook-delivery-read-repository-contract';

export type OutboundWebhookDeliveryAdminVisibilityCapability =
  | 'list_entry_contract'
  | 'detail_entry_contract'
  | 'read_contract_required'
  | 'admin_access_required'
  | 'redaction_required'
  | 'operator_actions_deferred'
  | 'runtime_delivery_deferred';

export type OutboundWebhookDeliveryAdminVisibilityEntryContract = {
  visibilityEntriesImplemented: false;
  adminPagesImplemented: false;
  storageReadyForRuntime: false;
  listEntryKey: 'outbound_webhook_delivery_list';
  detailEntryKey: 'outbound_webhook_delivery_detail';
  futureReadOnly: true;
  mutationsEnabled: false;
  capabilities: OutboundWebhookDeliveryAdminVisibilityCapability[];
  requiredReadOperations: string[];
  redactedFields: string[];
  auditLabels: string[];
};

export function buildOutboundWebhookDeliveryAdminVisibilityEntryContract(): OutboundWebhookDeliveryAdminVisibilityEntryContract {
  const readContract = buildOutboundWebhookDeliveryReadRepositoryContract();

  return {
    visibilityEntriesImplemented: false,
    adminPagesImplemented: false,
    storageReadyForRuntime: false,
    listEntryKey: 'outbound_webhook_delivery_list',
    detailEntryKey: 'outbound_webhook_delivery_detail',
    futureReadOnly: true,
    mutationsEnabled: false,
    capabilities: [
      'list_entry_contract',
      'detail_entry_contract',
      'read_contract_required',
      'admin_access_required',
      'redaction_required',
      'operator_actions_deferred',
      'runtime_delivery_deferred'
    ],
    requiredReadOperations: readContract.allowedOperations,
    redactedFields: readContract.redactedFields,
    auditLabels: [
      'admin-visibility-entry-contract:planned',
      'visibility-entries:disabled',
      'admin-pages:disabled',
      'future-read-only:true',
      'mutations:disabled',
      'operator-actions:disabled',
      'runtime-delivery:disabled'
    ]
  };
}
