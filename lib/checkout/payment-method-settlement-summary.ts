import type { CheckoutOrderSummary } from '@/lib/catalog';

export type MethodSettlementStatusCounts = {
  paid: number;
  pending: number;
  failed: number;
  refunded: number;
  cancelled: number;
  other: number;
};

export type MethodSettlementSummary = {
  methodKey: string;
  methodLabel: string;
  methodType: string;
  provider: string;
  currency: string;
  orderCount: number;
  grossTotalCents: number;
  paidTotalCents: number;
  refundedTotalCents: number;
  outstandingTotalCents: number;
  statusCounts: MethodSettlementStatusCounts;
  rawStatusCounts: Record<string, number>;
  totalCentsByStatus: Record<string, number>;
  codCollectionStatuses: Record<string, number>;
  codSettlementModes: Record<string, number>;
  manualReviewRequiredCount: number;
  timelineEvidenceCount: number;
  latestEvidenceTitles: string[];
};

export type ManualTransferSettlementTotals = {
  methodKeys: string[];
  currency: string;
  orderCount: number;
  receivedCount: number;
  pendingReviewCount: number;
  needsFollowUpCount: number;
  rejectedCount: number;
  receivedTotalCents: number;
  pendingReviewTotalCents: number;
  needsFollowUpTotalCents: number;
  rejectedTotalCents: number;
  manualReviewRequiredCount: number;
  timelineEvidenceCount: number;
};

const REVERSAL_EVIDENCE_PATTERNS = [
  'refund',
  'refunded',
  'void',
  'voided',
  'cancel',
  'cancelled',
  'cancellation',
  'adjustment',
  'reversal',
  'settlement',
  'collection'
];

const MANUAL_TRANSFER_METHOD_KEYS = new Set([
  'manual_transfer',
  'bank_transfer',
  'card_to_card',
  'manual',
  'offline_transfer'
]);

function cleanText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeStatus(value: string | undefined) {
  return cleanText(value, 'unknown').toLowerCase();
}

function incrementCounter(counter: Record<string, number>, key: string | undefined) {
  const normalized = cleanText(key, 'unknown').toLowerCase();
  counter[normalized] = (counter[normalized] || 0) + 1;
}

function incrementTotal(counter: Record<string, number>, key: string | undefined, amount: number) {
  const normalized = cleanText(key, 'unknown').toLowerCase();
  counter[normalized] = (counter[normalized] || 0) + amount;
}

function emptyStatusCounts(): MethodSettlementStatusCounts {
  return { paid: 0, pending: 0, failed: 0, refunded: 0, cancelled: 0, other: 0 };
}

function statusBucket(status: string): keyof MethodSettlementStatusCounts {
  if (status === 'paid' || status === 'captured' || status === 'received' || status === 'collected') return 'paid';
  if (status === 'pending' || status === 'pending_review' || status === 'needs_follow_up') return 'pending';
  if (status === 'failed' || status === 'rejected') return 'failed';
  if (status === 'refunded' || status === 'partially_refunded') return 'refunded';
  if (status === 'cancelled' || status === 'canceled' || status === 'voided' || status === 'void') return 'cancelled';
  return 'other';
}

function isPaidLike(status: string) {
  return statusBucket(status) === 'paid';
}

function isRefundedLike(status: string) {
  return statusBucket(status) === 'refunded';
}

function evidenceTitle(title: string | undefined) {
  const normalized = title?.trim();
  if (!normalized) return undefined;
  const lower = normalized.toLowerCase();
  return REVERSAL_EVIDENCE_PATTERNS.some((pattern) => lower.includes(pattern)) ? normalized : undefined;
}

function summaryKey(order: CheckoutOrderSummary) {
  const methodKey = cleanText(order.latestPaymentMethodKey, cleanText(order.latestPaymentProvider, 'unknown'));
  const provider = cleanText(order.latestPaymentProvider, 'unknown');
  const currency = cleanText(order.currency, 'CAD').toUpperCase();
  return `${methodKey}::${provider}::${currency}`;
}

function createSummary(order: CheckoutOrderSummary): MethodSettlementSummary {
  return {
    methodKey: cleanText(order.latestPaymentMethodKey, cleanText(order.latestPaymentProvider, 'unknown')),
    methodLabel: cleanText(order.latestPaymentMethodLabel, cleanText(order.latestPaymentMethodKey, 'Unknown method')),
    methodType: cleanText(order.latestPaymentMethodType, 'unknown'),
    provider: cleanText(order.latestPaymentProvider, 'unknown'),
    currency: cleanText(order.currency, 'CAD').toUpperCase(),
    orderCount: 0,
    grossTotalCents: 0,
    paidTotalCents: 0,
    refundedTotalCents: 0,
    outstandingTotalCents: 0,
    statusCounts: emptyStatusCounts(),
    rawStatusCounts: {},
    totalCentsByStatus: {},
    codCollectionStatuses: {},
    codSettlementModes: {},
    manualReviewRequiredCount: 0,
    timelineEvidenceCount: 0,
    latestEvidenceTitles: []
  };
}

function addOrderToSummary(summary: MethodSettlementSummary, order: CheckoutOrderSummary) {
  const status = normalizeStatus(order.latestPaymentStatus);
  const bucket = statusBucket(status);
  const totalCents = Number.isFinite(order.totalCents) ? order.totalCents : 0;
  const evidence = evidenceTitle(order.latestTimelineTitle);

  summary.orderCount += 1;
  summary.grossTotalCents += totalCents;
  summary.statusCounts[bucket] += 1;
  incrementCounter(summary.rawStatusCounts, status);
  incrementTotal(summary.totalCentsByStatus, status, totalCents);

  if (isPaidLike(status)) summary.paidTotalCents += totalCents;
  if (isRefundedLike(status)) summary.refundedTotalCents += order.latestWalletRefundTotalCents || totalCents;
  if (bucket === 'pending' || bucket === 'failed' || bucket === 'other') summary.outstandingTotalCents += totalCents;
  if (order.latestPaymentRequiresManualReview) summary.manualReviewRequiredCount += 1;

  if (order.latestCodCollectionStatus) incrementCounter(summary.codCollectionStatuses, order.latestCodCollectionStatus);
  if (order.latestCodSettlementMode) incrementCounter(summary.codSettlementModes, order.latestCodSettlementMode);
  if (evidence) {
    summary.timelineEvidenceCount += 1;
    if (!summary.latestEvidenceTitles.includes(evidence)) summary.latestEvidenceTitles.push(evidence);
    summary.latestEvidenceTitles = summary.latestEvidenceTitles.slice(0, 5);
  }
}

function isManualTransferSummary(summary: MethodSettlementSummary) {
  return (
    MANUAL_TRANSFER_METHOD_KEYS.has(summary.methodKey.toLowerCase()) ||
    summary.methodType.toLowerCase() === 'manual_transfer' ||
    summary.provider.toLowerCase() === 'manual'
  );
}

function statusCount(summary: MethodSettlementSummary, status: string) {
  return summary.rawStatusCounts[status] || 0;
}

function statusTotal(summary: MethodSettlementSummary, status: string) {
  return summary.totalCentsByStatus[status] || 0;
}

export function summarizeSettlementByPaymentMethod(orders: CheckoutOrderSummary[]): MethodSettlementSummary[] {
  const summaries = new Map<string, MethodSettlementSummary>();

  for (const order of orders) {
    const key = summaryKey(order);
    const summary = summaries.get(key) || createSummary(order);
    addOrderToSummary(summary, order);
    summaries.set(key, summary);
  }

  return Array.from(summaries.values()).sort((left, right) => {
    if (right.grossTotalCents !== left.grossTotalCents) return right.grossTotalCents - left.grossTotalCents;
    return left.methodKey.localeCompare(right.methodKey);
  });
}

export function summarizeManualTransferSettlementTotals(
  summaries: MethodSettlementSummary[],
  currency = 'CAD'
): ManualTransferSettlementTotals {
  const normalizedCurrency = cleanText(currency, 'CAD').toUpperCase();
  const methodKeys = new Set<string>();
  const totals: ManualTransferSettlementTotals = {
    methodKeys: [],
    currency: normalizedCurrency,
    orderCount: 0,
    receivedCount: 0,
    pendingReviewCount: 0,
    needsFollowUpCount: 0,
    rejectedCount: 0,
    receivedTotalCents: 0,
    pendingReviewTotalCents: 0,
    needsFollowUpTotalCents: 0,
    rejectedTotalCents: 0,
    manualReviewRequiredCount: 0,
    timelineEvidenceCount: 0
  };

  for (const summary of summaries) {
    if (!isManualTransferSummary(summary) || summary.currency !== normalizedCurrency) continue;
    methodKeys.add(summary.methodKey);
    totals.orderCount += summary.orderCount;
    totals.receivedCount += statusCount(summary, 'received') + statusCount(summary, 'paid') + statusCount(summary, 'captured');
    totals.pendingReviewCount += statusCount(summary, 'pending_review') + statusCount(summary, 'pending');
    totals.needsFollowUpCount += statusCount(summary, 'needs_follow_up');
    totals.rejectedCount += statusCount(summary, 'rejected') + statusCount(summary, 'failed');
    totals.receivedTotalCents += statusTotal(summary, 'received') + statusTotal(summary, 'paid') + statusTotal(summary, 'captured');
    totals.pendingReviewTotalCents += statusTotal(summary, 'pending_review') + statusTotal(summary, 'pending');
    totals.needsFollowUpTotalCents += statusTotal(summary, 'needs_follow_up');
    totals.rejectedTotalCents += statusTotal(summary, 'rejected') + statusTotal(summary, 'failed');
    totals.manualReviewRequiredCount += summary.manualReviewRequiredCount;
    totals.timelineEvidenceCount += summary.timelineEvidenceCount;
  }

  totals.methodKeys = Array.from(methodKeys).sort();
  return totals;
}
