export type OutboundWebhookDeliveryStorageCapability =
  | 'migration_exists'
  | 'schema_model_pending'
  | 'read_repository_pending'
  | 'write_repository_pending'
  | 'dispatcher_pending'
  | 'signing_runtime_pending'
  | 'recovery_controls_pending';

export type OutboundWebhookDeliveryStorageBoundary = {
  migrationTableName: 'OutboundWebhookDelivery';
  storageReadyForRuntime: false;
  prismaModelEnabled: boolean;
  repositoryReadsEnabled: false;
  repositoryWritesEnabled: false;
  dispatcherEnabled: false;
  signingRuntimeEnabled: false;
  recoveryControlsEnabled: false;
  capabilities: OutboundWebhookDeliveryStorageCapability[];
  auditLabels: string[];
};

export function buildOutboundWebhookDeliveryStorageBoundary(options: {
  prismaModelEnabled?: boolean;
  migrationExists?: boolean;
} = {}): OutboundWebhookDeliveryStorageBoundary {
  const migrationExists = options.migrationExists ?? true;
  const prismaModelEnabled = options.prismaModelEnabled ?? false;

  const capabilities: OutboundWebhookDeliveryStorageCapability[] = [];
  if (migrationExists) capabilities.push('migration_exists');
  if (!prismaModelEnabled) capabilities.push('schema_model_pending');
  capabilities.push(
    'read_repository_pending',
    'write_repository_pending',
    'dispatcher_pending',
    'signing_runtime_pending',
    'recovery_controls_pending'
  );

  return {
    migrationTableName: 'OutboundWebhookDelivery',
    storageReadyForRuntime: false,
    prismaModelEnabled,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    dispatcherEnabled: false,
    signingRuntimeEnabled: false,
    recoveryControlsEnabled: false,
    capabilities,
    auditLabels: [
      `migration:${migrationExists ? 'present' : 'missing'}`,
      `prisma-model:${prismaModelEnabled ? 'present' : 'pending'}`,
      'repository-reads:disabled',
      'repository-writes:disabled',
      'dispatcher:disabled',
      'signing-runtime:disabled',
      'recovery-controls:disabled'
    ]
  };
}
