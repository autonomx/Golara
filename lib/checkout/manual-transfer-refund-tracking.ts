export const MANUAL_TRANSFER_REFUND_TRACKING_VERSION = 'p6.manual-transfer-refund-tracking.v1';

export type ManualTransferRefundOperation = 'refund' | 'void';
export type ManualTransferRefundTrackingStatus = 'refund_recorded' | 'void_recorded';

export type ManualTransferRefundTrackingInput = {
  operation: ManualTransferRefundOperation;
  paymentAttemptId: string;
  orderId: string;
  fromStatus: string;
  amountCents: number;
  currency: string;
  providerReference?: string | null;
  manualPaymentReference?: string | null;
  note?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  recordedAt?: string | null;
};

export type ManualTransferRefundTrackingMetadata = Record<string, string | number | boolean | null>;

function optionalText(value?: string | null, maxLength = 240) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizedAmount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function trackingStatus(operation: ManualTransferRefundOperation): ManualTransferRefundTrackingStatus {
  return operation === 'refund' ? 'refund_recorded' : 'void_recorded';
}

export function buildManualTransferRefundTrackingMetadata(input: ManualTransferRefundTrackingInput): ManualTransferRefundTrackingMetadata {
  return {
    manualTransferRefundTrackingVersion: MANUAL_TRANSFER_REFUND_TRACKING_VERSION,
    manualTransferRefundOperation: input.operation,
    manualTransferRefundStatus: trackingStatus(input.operation),
    manualTransferRefundPaymentAttemptId: input.paymentAttemptId,
    manualTransferRefundOrderId: input.orderId,
    manualTransferRefundFromStatus: input.fromStatus,
    manualTransferRefundAmountCents: normalizedAmount(input.amountCents),
    manualTransferRefundCurrency: input.currency.trim().toUpperCase() || 'TOMAN',
    manualTransferRefundProviderReference: optionalText(input.providerReference),
    manualTransferRefundManualReference: optionalText(input.manualPaymentReference),
    manualTransferRefundNote: optionalText(input.note, 1000),
    manualTransferRefundRecordedBy: optionalText(input.actorLabel, 120) ?? 'Admin',
    manualTransferRefundRecordedRole: optionalText(input.actorRole, 80) ?? 'owner',
    manualTransferRefundRecordedAt: optionalText(input.recordedAt, 80)
  };
}
