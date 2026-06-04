import 'server-only';

import type { Prisma } from '@prisma/client';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';

export type PaymentOperationAuditKind =
  | 'preview_requested'
  | 'preview_blocked'
  | 'preview_manual_review'
  | 'pending_record_created'
  | 'idempotency_duplicate_reused'
  | 'idempotency_conflict_blocked'
  | 'record_submitted'
  | 'record_succeeded'
  | 'record_failed';

export type PaymentOperationAuditInput = {
  kind: PaymentOperationAuditKind;
  orderId?: string | null;
  paymentAttemptId?: string | null;
  paymentOperationRecordId?: string | null;
  idempotencyKey?: string | null;
  operationKind: string;
  provider: string;
  requestedAmountCents: number;
  currency: string;
  previewDecision?: string | null;
  previewReasons?: string[];
  conflicts?: string[];
  operatorReason?: string | null;
  metadata?: Record<string, Prisma.InputJsonValue | undefined>;
};

export type PaymentOperationAuditLogInput = {
  action: string;
  entity: 'paymentOperation';
  entityId?: string;
  summary: string;
  metadata: Prisma.InputJsonValue;
};

const actionByKind: Record<PaymentOperationAuditKind, string> = {
  preview_requested: 'payment_operation.preview.requested',
  preview_blocked: 'payment_operation.preview.blocked',
  preview_manual_review: 'payment_operation.preview.manual_review',
  pending_record_created: 'payment_operation.record.pending_created',
  idempotency_duplicate_reused: 'payment_operation.record.idempotency_duplicate_reused',
  idempotency_conflict_blocked: 'payment_operation.record.idempotency_conflict_blocked',
  record_submitted: 'payment_operation.record.submitted',
  record_succeeded: 'payment_operation.record.succeeded',
  record_failed: 'payment_operation.record.failed'
};

const summaryByKind: Record<PaymentOperationAuditKind, string> = {
  preview_requested: 'Payment operation preview requested',
  preview_blocked: 'Payment operation preview blocked',
  preview_manual_review: 'Payment operation preview requires manual review',
  pending_record_created: 'Pending payment operation record created',
  idempotency_duplicate_reused: 'Payment operation idempotency duplicate reused',
  idempotency_conflict_blocked: 'Payment operation idempotency conflict blocked',
  record_submitted: 'Payment operation record submitted',
  record_succeeded: 'Payment operation record succeeded',
  record_failed: 'Payment operation record failed'
};

function cleanText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function cleanList(values: string[] | undefined) {
  return Array.isArray(values) ? values.map((value) => value.trim()).filter(Boolean) : [];
}

function cleanMetadata(value: Record<string, Prisma.InputJsonValue | undefined> | undefined): Record<string, Prisma.InputJsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, Prisma.InputJsonValue] => entry[1] !== undefined));
}

export function buildPaymentOperationAuditLogInput(input: PaymentOperationAuditInput): PaymentOperationAuditLogInput {
  const operationRecordId = cleanText(input.paymentOperationRecordId);
  const orderId = cleanText(input.orderId);
  const paymentAttemptId = cleanText(input.paymentAttemptId);
  const previewReasons = cleanList(input.previewReasons);
  const conflicts = cleanList(input.conflicts);

  return {
    action: actionByKind[input.kind],
    entity: 'paymentOperation',
    entityId: operationRecordId || orderId || paymentAttemptId,
    summary: summaryByKind[input.kind],
    metadata: {
      ...cleanMetadata(input.metadata),
      kind: input.kind,
      orderId: orderId ?? null,
      paymentAttemptId: paymentAttemptId ?? null,
      paymentOperationRecordId: operationRecordId ?? null,
      idempotencyKey: cleanText(input.idempotencyKey) ?? null,
      operationKind: input.operationKind.trim().toLowerCase(),
      provider: input.provider.trim().toLowerCase(),
      requestedAmountCents: input.requestedAmountCents,
      currency: input.currency.trim().toUpperCase(),
      previewDecision: cleanText(input.previewDecision) ?? null,
      previewReasons,
      conflicts,
      operatorReason: cleanText(input.operatorReason) ?? null
    }
  };
}

export async function recordPaymentOperationAuditEvent(input: PaymentOperationAuditInput) {
  const audit = buildPaymentOperationAuditLogInput(input);
  await recordAdminAuditLog(audit);
}
