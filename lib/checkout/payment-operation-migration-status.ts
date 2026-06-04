export const PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV = 'PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED';

export const PAYMENT_OPERATION_RECORDS_MIGRATION_PATH = 'prisma/migrations/20260604200000_add_payment_operation_records/migration.sql';

export const PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH = 'docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md';

export type PaymentOperationRecordsMigrationStatus = {
  confirmed: boolean;
  flagName: typeof PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV;
  rawValue: string;
  migrationPath: typeof PAYMENT_OPERATION_RECORDS_MIGRATION_PATH;
  evidencePath: typeof PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH;
  summary: string;
  requiredBefore: string[];
  warnings: string[];
};

function normalizeFlagValue(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isPaymentOperationRecordsMigrationConfirmed(env: Record<string, string | undefined> = process.env) {
  return normalizeFlagValue(env[PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV]) === 'true';
}

export function getPaymentOperationRecordsMigrationStatus(
  env: Record<string, string | undefined> = process.env
): PaymentOperationRecordsMigrationStatus {
  const rawValue = env[PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV]?.trim() || '';
  const confirmed = isPaymentOperationRecordsMigrationConfirmed(env);

  return {
    confirmed,
    flagName: PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV,
    rawValue,
    migrationPath: PAYMENT_OPERATION_RECORDS_MIGRATION_PATH,
    evidencePath: PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH,
    summary: confirmed
      ? 'Payment operation records migration has been operator-confirmed for this environment.'
      : 'Payment operation records migration is not operator-confirmed for this environment.',
    requiredBefore: [
      'idempotent PaymentOperationRecord repository/service writes',
      'admin refund or void execution controls',
      'provider refund or void execution adapters',
      'order/payment mutation based on refund or void success',
      'inventory or capacity release based on refund or void success'
    ],
    warnings: confirmed
      ? []
      : [
          `Apply and verify ${PAYMENT_OPERATION_RECORDS_MIGRATION_PATH} in the target database.`,
          `Capture operator evidence in ${PAYMENT_OPERATION_RECORDS_MIGRATION_EVIDENCE_PATH}.`,
          `Set ${PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED_ENV}=true only after target-environment verification is complete.`
        ]
  };
}
