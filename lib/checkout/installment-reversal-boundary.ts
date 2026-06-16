export const INSTALLMENT_REVERSAL_BOUNDARY_VERSION = 'p6.installment-cancellation-refund-boundary.v1';
export const INSTALLMENT_REVERSAL_OPERATIONS = ['cancel', 'refund'] as const;

export type InstallmentReversalOperation = typeof INSTALLMENT_REVERSAL_OPERATIONS[number];

export type InstallmentReversalBoundaryInput = {
  operation: InstallmentReversalOperation;
  planId: string;
  orderId: string;
  paymentAttemptId: string;
  fromPlanStatus?: string | null;
  requestedAmountCents?: number | null;
  currency?: string | null;
  reason?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  recordedAt?: Date | string | null;
};

export type InstallmentReversalBoundaryMetadata = {
  installmentReversalBoundaryVersion: typeof INSTALLMENT_REVERSAL_BOUNDARY_VERSION;
  installmentReversalOperation: InstallmentReversalOperation;
  installmentReversalStatus: 'cancellation_recorded' | 'refund_recorded';
  installmentReversalPlanId: string;
  installmentReversalOrderId: string;
  installmentReversalPaymentAttemptId: string;
  installmentReversalFromPlanStatus: string;
  installmentReversalRequestedAmountCents: number;
  installmentReversalCurrency: string;
  installmentReversalReason: string | null;
  installmentReversalRecordedAt: string;
  installmentReversalRecordedBy: string;
  installmentReversalRecordedRole: string;
  installmentReversalRequiresScheduleReview: true;
  installmentReversalAffectsReceivables: true;
  installmentReversalInventoryPolicy: 'no_inventory_change';
};

function text(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function optionalText(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function moneyCents(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(Number(value)));
}

function recordedAtIso(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

export function normalizeInstallmentReversalOperation(value: string): InstallmentReversalOperation {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'cancel' || normalized === 'cancellation' || normalized === 'void') return 'cancel';
  if (normalized === 'refund' || normalized === 'refunded') return 'refund';
  throw new Error('Unsupported installment reversal operation.');
}

export function buildInstallmentReversalBoundaryMetadata(input: InstallmentReversalBoundaryInput): InstallmentReversalBoundaryMetadata {
  const operation = normalizeInstallmentReversalOperation(input.operation);

  return {
    installmentReversalBoundaryVersion: INSTALLMENT_REVERSAL_BOUNDARY_VERSION,
    installmentReversalOperation: operation,
    installmentReversalStatus: operation === 'refund' ? 'refund_recorded' : 'cancellation_recorded',
    installmentReversalPlanId: text(input.planId, 'unknown-plan'),
    installmentReversalOrderId: text(input.orderId, 'unknown-order'),
    installmentReversalPaymentAttemptId: text(input.paymentAttemptId, 'unknown-attempt'),
    installmentReversalFromPlanStatus: text(input.fromPlanStatus, 'unknown'),
    installmentReversalRequestedAmountCents: moneyCents(input.requestedAmountCents),
    installmentReversalCurrency: text(input.currency, 'IRR').toUpperCase(),
    installmentReversalReason: optionalText(input.reason, 1000),
    installmentReversalRecordedAt: recordedAtIso(input.recordedAt),
    installmentReversalRecordedBy: text(input.actorLabel, 'Admin').slice(0, 120),
    installmentReversalRecordedRole: text(input.actorRole, 'owner').slice(0, 80),
    installmentReversalRequiresScheduleReview: true,
    installmentReversalAffectsReceivables: true,
    installmentReversalInventoryPolicy: 'no_inventory_change'
  };
}
