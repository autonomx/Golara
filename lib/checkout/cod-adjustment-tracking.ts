export const COD_ADJUSTMENT_TRACKING_VERSION = 'p6.cod-adjustment-tracking.v1';

export type CodAdjustmentOperation = 'adjustment' | 'refund' | 'void';
export type CodAdjustmentTrackingStatus = 'adjustment_recorded' | 'refund_recorded' | 'void_recorded';

export type CodAdjustmentTrackingInput = {
  operation: CodAdjustmentOperation;
  paymentAttemptId: string;
  orderId: string;
  fromPaymentStatus: string;
  fromCollectionStatus: string;
  amountCents: number;
  currency: string;
  collectionStatus?: string | null;
  settlementStatus?: string | null;
  settlementReference?: string | null;
  providerReference?: string | null;
  note?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  recordedAt?: string | null;
};

export type CodAdjustmentTrackingMetadata = Record<string, string | number | boolean | null>;

function optionalText(value?: string | null, maxLength = 240) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizedAmount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function trackingStatus(operation: CodAdjustmentOperation): CodAdjustmentTrackingStatus {
  if (operation === 'refund') return 'refund_recorded';
  if (operation === 'void') return 'void_recorded';
  return 'adjustment_recorded';
}

export function buildCodAdjustmentTrackingMetadata(input: CodAdjustmentTrackingInput): CodAdjustmentTrackingMetadata {
  return {
    codAdjustmentTrackingVersion: COD_ADJUSTMENT_TRACKING_VERSION,
    codAdjustmentOperation: input.operation,
    codAdjustmentStatus: trackingStatus(input.operation),
    codAdjustmentPaymentAttemptId: input.paymentAttemptId,
    codAdjustmentOrderId: input.orderId,
    codAdjustmentFromPaymentStatus: input.fromPaymentStatus,
    codAdjustmentFromCollectionStatus: input.fromCollectionStatus,
    codAdjustmentAmountCents: normalizedAmount(input.amountCents),
    codAdjustmentCurrency: input.currency.trim().toUpperCase() || 'TOMAN',
    codAdjustmentCollectionStatus: optionalText(input.collectionStatus),
    codAdjustmentSettlementStatus: optionalText(input.settlementStatus),
    codAdjustmentSettlementReference: optionalText(input.settlementReference),
    codAdjustmentProviderReference: optionalText(input.providerReference),
    codAdjustmentNote: optionalText(input.note, 1000),
    codAdjustmentRecordedBy: optionalText(input.actorLabel, 120) ?? 'Admin',
    codAdjustmentRecordedRole: optionalText(input.actorRole, 80) ?? 'owner',
    codAdjustmentRecordedAt: optionalText(input.recordedAt, 80)
  };
}
