export type OutboundWebhookDeliveryStatusContract = {
  initial: 'planned';
  active: ['pending', 'retry_wait'];
  terminal: ['delivered', 'failed', 'dead_letter'];
  auditLabels: string[];
};

export function buildOutboundWebhookDeliveryStatusContract(): OutboundWebhookDeliveryStatusContract {
  return {
    initial: 'planned',
    active: ['pending', 'retry_wait'],
    terminal: ['delivered', 'failed', 'dead_letter'],
    auditLabels: [
      'status-contract:planned',
      'runtime:disabled',
      'external-calls:disabled'
    ]
  };
}
