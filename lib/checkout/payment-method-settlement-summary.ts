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
  codCollectionStatuses: Record<string, number>;
  codSettlementModes: Record<string, number>;
  manualReviewRequiredCount: number;
  timelineEvidenceCount: number;
  latestEvidenceTitles: string[];
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
