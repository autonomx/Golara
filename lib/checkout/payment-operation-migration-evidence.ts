export type PaymentOperationMigrationEvidenceInput = {
  deployedSha?: string;
  migrationApplied?: boolean;
  tableVerified?: boolean;
  foreignKeysVerified?: boolean;
  idempotencyIndexVerified?: boolean;
  lookupIndexesVerified?: boolean;
  applicationReadAccessVerified?: boolean;
  rollbackConfirmed?: boolean;
  operatorSignoff?: boolean;
};

export type PaymentOperationMigrationEvidenceCheck = {
  key: string;
  label: string;
  status: 'ready' | 'missing';
  detail: string;
};

export type PaymentOperationMigrationEvidenceValidation = {
  complete: boolean;
  executionEnabled: false;
  missing: string[];
  checks: PaymentOperationMigrationEvidenceCheck[];
  warnings: string[];
};

const REQUIREMENTS: Array<{
  inputKey: keyof PaymentOperationMigrationEvidenceInput;
  missingCode: string;
  label: string;
}> = [
  { inputKey: 'deployedSha', missingCode: 'deployed_sha_missing', label: 'Deployed SHA' },
  { inputKey: 'migrationApplied', missingCode: 'migration_application_missing', label: 'Migration application' },
  { inputKey: 'tableVerified', missingCode: 'table_verification_missing', label: 'Table verification' },
  { inputKey: 'foreignKeysVerified', missingCode: 'foreign_key_verification_missing', label: 'Foreign key verification' },
  { inputKey: 'idempotencyIndexVerified', missingCode: 'idempotency_index_verification_missing', label: 'Idempotency index verification' },
  { inputKey: 'lookupIndexesVerified', missingCode: 'lookup_index_verification_missing', label: 'Lookup index verification' },
  { inputKey: 'applicationReadAccessVerified', missingCode: 'application_read_access_missing', label: 'Application read access' },
  { inputKey: 'rollbackConfirmed', missingCode: 'rollback_confirmation_missing', label: 'Rollback confirmation' },
  { inputKey: 'operatorSignoff', missingCode: 'operator_signoff_missing', label: 'Operator sign-off' }
];

function hasEvidence(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : value === true;
}

export function validatePaymentOperationMigrationEvidence(
  input: PaymentOperationMigrationEvidenceInput
): PaymentOperationMigrationEvidenceValidation {
  const checks = REQUIREMENTS.map((requirement) => {
    const ready = hasEvidence(input[requirement.inputKey]);
    return {
      key: requirement.missingCode,
      label: requirement.label,
      status: ready ? 'ready' as const : 'missing' as const,
      detail: ready
        ? `${requirement.label} evidence is captured for operator review.`
        : `${requirement.label} evidence must be captured before migration confirmation is trusted.`
    };
  });
  const missing = checks.filter((check) => check.status === 'missing').map((check) => check.key);

  return {
    complete: missing.length === 0,
    executionEnabled: false,
    missing,
    checks,
    warnings: missing.length === 0
      ? ['migration_evidence_complete_but_execution_still_disabled']
      : ['migration_evidence_incomplete']
  };
}
