import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type PaymentOperationRecordStatus = 'pending' | 'submitted' | 'succeeded' | 'failed' | 'manual_review';

export type PaymentOperationRecordRow = {
  id: string;
  orderId: string;
  paymentAttemptId: string;
  orderNumber: string | null;
  operationKind: string;
  requestedAmountCents: number;
  currency: string;
  originalPaymentAmountCents: number | null;
  originalPaymentCurrency: string | null;
  provider: string;
  providerReference: string | null;
  idempotencyKey: string;
  operatorId: string | null;
  operatorLabel: string | null;
  operatorEmail: string | null;
  operatorReason: string | null;
  previewDecision: string;
  previewReasons: string[];
  status: PaymentOperationRecordStatus;
  providerOperationReference: string | null;
  providerStatus: string | null;
  errorCategory: string | null;
  retryable: boolean;
  transitionPlan: Record<string, unknown>;
  metadata: Record<string, unknown>;
  submittedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePendingPaymentOperationRecordInput = {
  orderId: string;
  paymentAttemptId: string;
  orderNumber?: string | null;
  operationKind: 'refund' | 'void' | string;
  requestedAmountCents: number;
  currency: string;
  originalPaymentAmountCents?: number | null;
  originalPaymentCurrency?: string | null;
  provider: string;
  providerReference?: string | null;
  idempotencyKey: string;
  operatorId?: string | null;
  operatorLabel?: string | null;
  operatorEmail?: string | null;
  operatorReason?: string | null;
  previewDecision: string;
  previewReasons: string[];
  transitionPlan?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type CreatePendingPaymentOperationRecordResult =
  | { status: 'created'; record: PaymentOperationRecordRow }
  | { status: 'duplicate'; record: PaymentOperationRecordRow }
  | { status: 'conflict'; record: PaymentOperationRecordRow; conflicts: string[] }
  | { status: 'unavailable'; reason: string };

export type PaymentOperationRecordTransitionResult =
  | { status: 'updated'; record: PaymentOperationRecordRow }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: string };

export type MarkPaymentOperationSubmittedInput = {
  id: string;
  providerOperationReference?: string | null;
  providerStatus?: string | null;
  metadata?: Record<string, unknown>;
};

export type MarkPaymentOperationSucceededInput = {
  id: string;
  providerOperationReference?: string | null;
  providerStatus?: string | null;
  metadata?: Record<string, unknown>;
};

export type MarkPaymentOperationFailedInput = {
  id: string;
  providerOperationReference?: string | null;
  providerStatus?: string | null;
  errorCategory?: string | null;
  retryable?: boolean;
  metadata?: Record<string, unknown>;
};

function cleanText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cleanCurrency(value: string) {
  return value.trim().toUpperCase();
}

function cleanProvider(value: string) {
  return value.trim().toLowerCase();
}

function cleanObject(value: Record<string, unknown> | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function sameNullableNumber(left: number | null, right: number | null | undefined) {
  return left === (right ?? null);
}

function idempotencyConflicts(existing: PaymentOperationRecordRow, input: CreatePendingPaymentOperationRecordInput) {
  const conflicts: string[] = [];
  if (existing.orderId !== input.orderId) conflicts.push('orderId');
  if (existing.paymentAttemptId !== input.paymentAttemptId) conflicts.push('paymentAttemptId');
  if (existing.operationKind !== cleanProvider(input.operationKind)) conflicts.push('operationKind');
  if (existing.requestedAmountCents !== input.requestedAmountCents) conflicts.push('requestedAmountCents');
  if (existing.currency !== cleanCurrency(input.currency)) conflicts.push('currency');
  if (existing.provider !== cleanProvider(input.provider)) conflicts.push('provider');
  if ((existing.providerReference ?? null) !== cleanText(input.providerReference)) conflicts.push('providerReference');
  if (!sameNullableNumber(existing.originalPaymentAmountCents, input.originalPaymentAmountCents)) conflicts.push('originalPaymentAmountCents');
  if ((existing.originalPaymentCurrency ?? null) !== (input.originalPaymentCurrency ? cleanCurrency(input.originalPaymentCurrency) : null)) conflicts.push('originalPaymentCurrency');
  return conflicts;
}

export async function findPaymentOperationRecordByIdempotencyKey(idempotencyKey: string) {
  if (!hasDatabase()) return null;
  const rows = await prisma.$queryRaw<PaymentOperationRecordRow[]>`
    SELECT * FROM "PaymentOperationRecord"
    WHERE "idempotencyKey" = ${idempotencyKey.trim()}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createPendingPaymentOperationRecord(input: CreatePendingPaymentOperationRecordInput): Promise<CreatePendingPaymentOperationRecordResult> {
  if (!hasDatabase()) return { status: 'unavailable', reason: 'database_unavailable' };

  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) return { status: 'unavailable', reason: 'idempotency_key_required' };

  const inserted = await prisma.$queryRaw<PaymentOperationRecordRow[]>`
    INSERT INTO "PaymentOperationRecord" (
      "orderId", "paymentAttemptId", "orderNumber", "operationKind", "requestedAmountCents", "currency",
      "originalPaymentAmountCents", "originalPaymentCurrency", "provider", "providerReference", "idempotencyKey",
      "operatorId", "operatorLabel", "operatorEmail", "operatorReason", "previewDecision", "previewReasons",
      "status", "transitionPlan", "metadata", "updatedAt"
    ) VALUES (
      ${input.orderId}, ${input.paymentAttemptId}, ${cleanText(input.orderNumber)}, ${cleanProvider(input.operationKind)}, ${input.requestedAmountCents}, ${cleanCurrency(input.currency)},
      ${input.originalPaymentAmountCents ?? null}, ${input.originalPaymentCurrency ? cleanCurrency(input.originalPaymentCurrency) : null}, ${cleanProvider(input.provider)}, ${cleanText(input.providerReference)}, ${idempotencyKey},
      ${cleanText(input.operatorId)}, ${cleanText(input.operatorLabel)}, ${cleanText(input.operatorEmail)}, ${cleanText(input.operatorReason)}, ${input.previewDecision.trim()}, ${input.previewReasons},
      'pending', ${cleanObject(input.transitionPlan)}, ${cleanObject(input.metadata)}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("idempotencyKey") DO NOTHING
    RETURNING *
  `;

  const created = inserted[0];
  if (created) return { status: 'created', record: created };

  const existing = await findPaymentOperationRecordByIdempotencyKey(idempotencyKey);
  if (!existing) return { status: 'unavailable', reason: 'idempotency_lookup_failed' };

  const conflicts = idempotencyConflicts(existing, input);
  if (conflicts.length > 0) return { status: 'conflict', record: existing, conflicts };
  return { status: 'duplicate', record: existing };
}

export async function markPaymentOperationRecordSubmitted(input: MarkPaymentOperationSubmittedInput): Promise<PaymentOperationRecordTransitionResult> {
  if (!hasDatabase()) return { status: 'unavailable', reason: 'database_unavailable' };
  const rows = await prisma.$queryRaw<PaymentOperationRecordRow[]>`
    UPDATE "PaymentOperationRecord"
    SET "status" = 'submitted',
        "providerOperationReference" = COALESCE(${cleanText(input.providerOperationReference)}, "providerOperationReference"),
        "providerStatus" = COALESCE(${cleanText(input.providerStatus)}, "providerStatus"),
        "metadata" = "metadata" || ${cleanObject(input.metadata)}::jsonb,
        "submittedAt" = COALESCE("submittedAt", CURRENT_TIMESTAMP),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.id}
      AND "status" IN ('pending', 'manual_review')
    RETURNING *
  `;
  return rows[0] ? { status: 'updated', record: rows[0] } : { status: 'not_found' };
}

export async function markPaymentOperationRecordSucceeded(input: MarkPaymentOperationSucceededInput): Promise<PaymentOperationRecordTransitionResult> {
  if (!hasDatabase()) return { status: 'unavailable', reason: 'database_unavailable' };
  const rows = await prisma.$queryRaw<PaymentOperationRecordRow[]>`
    UPDATE "PaymentOperationRecord"
    SET "status" = 'succeeded',
        "providerOperationReference" = COALESCE(${cleanText(input.providerOperationReference)}, "providerOperationReference"),
        "providerStatus" = COALESCE(${cleanText(input.providerStatus)}, "providerStatus"),
        "metadata" = "metadata" || ${cleanObject(input.metadata)}::jsonb,
        "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.id}
      AND "status" IN ('pending', 'submitted', 'manual_review')
    RETURNING *
  `;
  return rows[0] ? { status: 'updated', record: rows[0] } : { status: 'not_found' };
}

export async function markPaymentOperationRecordFailed(input: MarkPaymentOperationFailedInput): Promise<PaymentOperationRecordTransitionResult> {
  if (!hasDatabase()) return { status: 'unavailable', reason: 'database_unavailable' };
  const rows = await prisma.$queryRaw<PaymentOperationRecordRow[]>`
    UPDATE "PaymentOperationRecord"
    SET "status" = 'failed',
        "providerOperationReference" = COALESCE(${cleanText(input.providerOperationReference)}, "providerOperationReference"),
        "providerStatus" = COALESCE(${cleanText(input.providerStatus)}, "providerStatus"),
        "errorCategory" = COALESCE(${cleanText(input.errorCategory)}, "errorCategory"),
        "retryable" = ${input.retryable ?? false},
        "metadata" = "metadata" || ${cleanObject(input.metadata)}::jsonb,
        "completedAt" = COALESCE("completedAt", CURRENT_TIMESTAMP),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${input.id}
      AND "status" IN ('pending', 'submitted', 'manual_review')
    RETURNING *
  `;
  return rows[0] ? { status: 'updated', record: rows[0] } : { status: 'not_found' };
}

export async function listPaymentOperationRecordsForOrder(orderId: string, limit = 25) {
  if (!hasDatabase()) return [];
  return prisma.$queryRaw<PaymentOperationRecordRow[]>`
    SELECT * FROM "PaymentOperationRecord"
    WHERE "orderId" = ${orderId}
    ORDER BY "createdAt" DESC
    LIMIT ${Math.max(1, Math.min(limit, 100))}
  `;
}

export const paymentOperationRecordRepository = {
  createPending: createPendingPaymentOperationRecord,
  findByIdempotencyKey: findPaymentOperationRecordByIdempotencyKey,
  markSubmitted: markPaymentOperationRecordSubmitted,
  markSucceeded: markPaymentOperationRecordSucceeded,
  markFailed: markPaymentOperationRecordFailed,
  listForOrder: listPaymentOperationRecordsForOrder
};
