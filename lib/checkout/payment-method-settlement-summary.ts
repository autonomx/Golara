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
  totalCentsByCodCollectionStatus: Record<string, number>;
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

export type CodCollectionSettlementTotals = {
  methodKeys: string[];
  currency: string;
  orderCount: number;
  collectedCount: number;
  pendingCollectionCount: number;
  failedCollectionCount: number;
  waivedCollectionCount: number;
  collectedTotalCents: number;
  pendingCollectionTotalCents: number;
  failedCollectionTotalCents: number;
  waivedCollectionTotalCents: number;
  collectionStatuses: Record<string, number>;
  settlementModes: Record<string, number>;
  ownerAdjustmentEvidenceCount: number;
  timelineEvidenceCount: number;
};

export type WalletLiabilityBalanceInput = {
  id?: string | null;
  customerId?: string | null;
  currency?: string | null;
  availableBalanceCents?: number | null;
  reservedBalanceCents?: number | null;
  lifetimeCreditCents?: number | null;
  lifetimeDebitCents?: number | null;
  lastEntryAt?: Date | string | null;
  entryCount?: number | null;
};

export type WalletLiabilityBalance = {
  currency: string;
  walletCount: number;
  availableLiabilityCents: number;
  reservedLiabilityCents: number;
  totalLiabilityCents: number;
  lifetimeCreditCents: number;
  lifetimeDebitCents: number;
  ledgerEntryCount: number;
  latestWalletActivityAt: string | null;
  walletMethodKeys: string[];
  walletOrderCount: number;
  walletCapturedTotalCents: number;
  walletRefundedTotalCents: number;
  walletOutstandingOrderTotalCents: number;
  walletTimelineEvidenceCount: number;
};

export type InstallmentReceivableScheduleEntryInput = {
  id?: string | null;
  planId?: string | null;
  currency?: string | null;
  amountCents?: number | null;
  paidAmountCents?: number | null;
  status?: string | null;
  dueAt?: Date | string | null;
  paidAt?: Date | string | null;
};

export type InstallmentReceivablesSummary = {
  currency: string;
  planIds: string[];
  entryCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  waivedCount: number;
  overdueCount: number;
  remainingCount: number;
  paidTotalCents: number;
  pendingTotalCents: number;
  failedTotalCents: number;
  waivedTotalCents: number;
  overdueTotalCents: number;
  remainingTotalCents: number;
  latestDueAt: string | null;
  nextDueAt: string | null;
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

const WALLET_METHOD_KEYS = new Set(['wallet', 'customer_wallet', 'store_credit']);
const COD_METHOD_KEYS = new Set(['cod', 'cash_on_delivery', 'cash-on-delivery', 'pay_on_delivery', 'pay-on-delivery']);
const COD_PENDING_COLLECTION_STATUSES = new Set(['pending', 'pending_delivery', 'ready_for_delivery', 'uncollected']);
const INSTALLMENT_PAID_STATUSES = new Set(['paid', 'collected']);
const INSTALLMENT_FAILED_STATUSES = new Set(['failed', 'rejected']);
const INSTALLMENT_WAIVED_STATUSES = new Set(['waived', 'cancelled', 'canceled']);

function cleanText(value: string | undefined | null, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeStatus(value: string | undefined | null) {
  return cleanText(value, 'unknown').toLowerCase();
}

function normalizeCurrency(value?: string | null) {
  return cleanText(value, 'CAD').toUpperCase();
}

function normalizeMinorUnit(value?: number | null) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value as number));
}

function normalizeActivityTime(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseTime(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function incrementCounter(counter: Record<string, number>, key: string | undefined | null) {
  const normalized = cleanText(key, 'unknown').toLowerCase();
  counter[normalized] = (counter[normalized] || 0) + 1;
}

function incrementTotal(counter: Record<string, number>, key: string | undefined | null, amount: number) {
  const normalized = cleanText(key, 'unknown').toLowerCase();
  counter[normalized] = (counter[normalized] || 0) + amount;
}

function mergeCounters(target: Record<string, number>, source: Record<string, number>) {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] || 0) + count;
  }
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

function orderMethodKey(order: CheckoutOrderSummary) {
  return cleanText(order.latestPaymentMethodKey, cleanText(order.latestPaymentProvider, 'unknown'));
}

function isCodOrder(order: CheckoutOrderSummary) {
  const methodKey = orderMethodKey(order).toLowerCase();
  const methodType = cleanText(order.latestPaymentMethodType, 'unknown').toLowerCase();
  const provider = cleanText(order.latestPaymentProvider, 'unknown').toLowerCase();
  return COD_METHOD_KEYS.has(methodKey) || methodType === 'cod' || provider === 'cod';
}

function codCollectionStatusForOrder(order: CheckoutOrderSummary) {
  if (order.latestCodCollectionStatus) return normalizeStatus(order.latestCodCollectionStatus);
  return isCodOrder(order) ? 'pending' : undefined;
}

function summaryKey(order: CheckoutOrderSummary) {
  const methodKey = orderMethodKey(order);
  const provider = cleanText(order.latestPaymentProvider, 'unknown');
  const currency = normalizeCurrency(order.currency);
  return `${methodKey}::${provider}::${currency}`;
}

function createSummary(order: CheckoutOrderSummary): MethodSettlementSummary {
  return {
    methodKey: orderMethodKey(order),
    methodLabel: cleanText(order.latestPaymentMethodLabel, cleanText(order.latestPaymentMethodKey, 'Unknown method')),
    methodType: cleanText(order.latestPaymentMethodType, 'unknown'),
    provider: cleanText(order.latestPaymentProvider, 'unknown'),
    currency: normalizeCurrency(order.currency),
    orderCount: 0,
    grossTotalCents: 0,
    paidTotalCents: 0,
    refundedTotalCents: 0,
    outstandingTotalCents: 0,
    statusCounts: emptyStatusCounts(),
    rawStatusCounts: {},
    totalCentsByStatus: {},
    codCollectionStatuses: {},
    totalCentsByCodCollectionStatus: {},
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
  const codCollectionStatus = codCollectionStatusForOrder(order);

  summary.orderCount += 1;
  summary.grossTotalCents += totalCents;
  summary.statusCounts[bucket] += 1;
  incrementCounter(summary.rawStatusCounts, status);
  incrementTotal(summary.totalCentsByStatus, status, totalCents);

  if (isPaidLike(status)) summary.paidTotalCents += totalCents;
  if (isRefundedLike(status)) summary.refundedTotalCents += order.latestWalletRefundTotalCents || totalCents;
  if (bucket === 'pending' || bucket === 'failed' || bucket === 'other') summary.outstandingTotalCents += totalCents;
  if (order.latestPaymentRequiresManualReview) summary.manualReviewRequiredCount += 1;

  if (codCollectionStatus) {
    incrementCounter(summary.codCollectionStatuses, codCollectionStatus);
    incrementTotal(summary.totalCentsByCodCollectionStatus, codCollectionStatus, totalCents);
  }
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

function isWalletSummary(summary: MethodSettlementSummary) {
  return (
    WALLET_METHOD_KEYS.has(summary.methodKey.toLowerCase()) ||
    summary.methodType.toLowerCase() === 'wallet' ||
    summary.provider.toLowerCase() === 'wallet'
  );
}

function isCodSummary(summary: MethodSettlementSummary) {
  return (
    COD_METHOD_KEYS.has(summary.methodKey.toLowerCase()) ||
    summary.methodType.toLowerCase() === 'cod' ||
    summary.provider.toLowerCase() === 'cod'
  );
}

function statusCount(summary: MethodSettlementSummary, status: string) {
  return summary.rawStatusCounts[status] || 0;
}

function statusTotal(summary: MethodSettlementSummary, status: string) {
  return summary.totalCentsByStatus[status] || 0;
}

function codStatusCount(summary: MethodSettlementSummary, status: string) {
  return summary.codCollectionStatuses[status] || 0;
}

function codStatusTotal(summary: MethodSettlementSummary, status: string) {
  return summary.totalCentsByCodCollectionStatus[status] || 0;
}

function codPendingCollectionCount(summary: MethodSettlementSummary) {
  return Array.from(COD_PENDING_COLLECTION_STATUSES).reduce((total, status) => total + codStatusCount(summary, status), 0);
}

function codPendingCollectionTotal(summary: MethodSettlementSummary) {
  return Array.from(COD_PENDING_COLLECTION_STATUSES).reduce((total, status) => total + codStatusTotal(summary, status), 0);
}

function countAdjustmentEvidence(summary: MethodSettlementSummary) {
  return summary.latestEvidenceTitles.filter((title) => title.toLowerCase().includes('adjustment')).length;
}

function emptyCodCollectionTotals(currency: string): CodCollectionSettlementTotals {
  return {
    methodKeys: [],
    currency,
    orderCount: 0,
    collectedCount: 0,
    pendingCollectionCount: 0,
    failedCollectionCount: 0,
    waivedCollectionCount: 0,
    collectedTotalCents: 0,
    pendingCollectionTotalCents: 0,
    failedCollectionTotalCents: 0,
    waivedCollectionTotalCents: 0,
    collectionStatuses: {},
    settlementModes: {},
    ownerAdjustmentEvidenceCount: 0,
    timelineEvidenceCount: 0
  };
}

function emptyWalletLiability(currency: string): WalletLiabilityBalance {
  return {
    currency,
    walletCount: 0,
    availableLiabilityCents: 0,
    reservedLiabilityCents: 0,
    totalLiabilityCents: 0,
    lifetimeCreditCents: 0,
    lifetimeDebitCents: 0,
    ledgerEntryCount: 0,
    latestWalletActivityAt: null,
    walletMethodKeys: [],
    walletOrderCount: 0,
    walletCapturedTotalCents: 0,
    walletRefundedTotalCents: 0,
    walletOutstandingOrderTotalCents: 0,
    walletTimelineEvidenceCount: 0
  };
}

function emptyInstallmentReceivables(currency: string): InstallmentReceivablesSummary {
  return {
    currency,
    planIds: [],
    entryCount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    waivedCount: 0,
    overdueCount: 0,
    remainingCount: 0,
    paidTotalCents: 0,
    pendingTotalCents: 0,
    failedTotalCents: 0,
    waivedTotalCents: 0,
    overdueTotalCents: 0,
    remainingTotalCents: 0,
    latestDueAt: null,
    nextDueAt: null
  };
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
  const normalizedCurrency = normalizeCurrency(currency);
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

export function summarizeCodCollectionSettlementTotals(
  summaries: MethodSettlementSummary[],
  currency = 'CAD'
): CodCollectionSettlementTotals {
  const normalizedCurrency = normalizeCurrency(currency);
  const methodKeys = new Set<string>();
  const totals = emptyCodCollectionTotals(normalizedCurrency);

  for (const summary of summaries) {
    if (!isCodSummary(summary) || summary.currency !== normalizedCurrency) continue;
    methodKeys.add(summary.methodKey);
    totals.orderCount += summary.orderCount;
    totals.collectedCount += codStatusCount(summary, 'collected');
    totals.pendingCollectionCount += codPendingCollectionCount(summary);
    totals.failedCollectionCount += codStatusCount(summary, 'failed');
    totals.waivedCollectionCount += codStatusCount(summary, 'waived');
    totals.collectedTotalCents += codStatusTotal(summary, 'collected');
    totals.pendingCollectionTotalCents += codPendingCollectionTotal(summary);
    totals.failedCollectionTotalCents += codStatusTotal(summary, 'failed');
    totals.waivedCollectionTotalCents += codStatusTotal(summary, 'waived');
    totals.ownerAdjustmentEvidenceCount += countAdjustmentEvidence(summary);
    totals.timelineEvidenceCount += summary.timelineEvidenceCount;
    mergeCounters(totals.collectionStatuses, summary.codCollectionStatuses);
    mergeCounters(totals.settlementModes, summary.codSettlementModes);
  }

  totals.methodKeys = Array.from(methodKeys).sort();
  return totals;
}

export function summarizeWalletLiabilityBalances(
  wallets: WalletLiabilityBalanceInput[],
  summaries: MethodSettlementSummary[],
  currency = 'TOMAN'
): WalletLiabilityBalance {
  const normalizedCurrency = normalizeCurrency(currency);
  const liability = emptyWalletLiability(normalizedCurrency);
  const walletMethodKeys = new Set<string>();

  for (const wallet of wallets) {
    if (normalizeCurrency(wallet.currency) !== normalizedCurrency) continue;
    liability.walletCount += 1;
    liability.availableLiabilityCents += normalizeMinorUnit(wallet.availableBalanceCents);
    liability.reservedLiabilityCents += normalizeMinorUnit(wallet.reservedBalanceCents);
    liability.lifetimeCreditCents += normalizeMinorUnit(wallet.lifetimeCreditCents);
    liability.lifetimeDebitCents += normalizeMinorUnit(wallet.lifetimeDebitCents);
    liability.ledgerEntryCount += normalizeMinorUnit(wallet.entryCount);

    const activityAt = normalizeActivityTime(wallet.lastEntryAt);
    if (activityAt && (!liability.latestWalletActivityAt || activityAt > liability.latestWalletActivityAt)) {
      liability.latestWalletActivityAt = activityAt;
    }
  }

  for (const summary of summaries) {
    if (!isWalletSummary(summary) || summary.currency !== normalizedCurrency) continue;
    walletMethodKeys.add(summary.methodKey);
    liability.walletOrderCount += summary.orderCount;
    liability.walletCapturedTotalCents += summary.paidTotalCents;
    liability.walletRefundedTotalCents += summary.refundedTotalCents;
    liability.walletOutstandingOrderTotalCents += summary.outstandingTotalCents;
    liability.walletTimelineEvidenceCount += summary.timelineEvidenceCount;
  }

  liability.totalLiabilityCents = liability.availableLiabilityCents + liability.reservedLiabilityCents;
  liability.walletMethodKeys = Array.from(walletMethodKeys).sort();
  return liability;
}

export function summarizeInstallmentReceivables(
  scheduleEntries: InstallmentReceivableScheduleEntryInput[],
  currency = 'CAD',
  asOf: Date | string = new Date()
): InstallmentReceivablesSummary {
  const normalizedCurrency = normalizeCurrency(currency);
  const asOfDate = parseTime(asOf) || new Date();
  const planIds = new Set<string>();
  const summary = emptyInstallmentReceivables(normalizedCurrency);

  for (const entry of scheduleEntries) {
    if (normalizeCurrency(entry.currency) !== normalizedCurrency) continue;
    const status = normalizeStatus(entry.status);
    const amountCents = normalizeMinorUnit(entry.amountCents);
    const paidAmountCents = normalizeMinorUnit(entry.paidAmountCents);
    const dueAt = parseTime(entry.dueAt);
    const dueAtIso = dueAt?.toISOString() || null;
    const remainingCents = Math.max(0, amountCents - paidAmountCents);
    const isPaid = INSTALLMENT_PAID_STATUSES.has(status);
    const isFailed = INSTALLMENT_FAILED_STATUSES.has(status);
    const isWaived = INSTALLMENT_WAIVED_STATUSES.has(status);
    const isOverdue = !isPaid && !isWaived && !!dueAt && dueAt < asOfDate;

    summary.entryCount += 1;
    if (entry.planId) planIds.add(entry.planId);
    if (dueAtIso && (!summary.latestDueAt || dueAtIso > summary.latestDueAt)) summary.latestDueAt = dueAtIso;
    if (dueAt && dueAtIso && dueAt >= asOfDate && (!summary.nextDueAt || dueAtIso < summary.nextDueAt)) {
      summary.nextDueAt = dueAtIso;
    }

    if (isPaid) {
      summary.paidCount += 1;
      summary.paidTotalCents += paidAmountCents || amountCents;
      continue;
    }

    if (isWaived) {
      summary.waivedCount += 1;
      summary.waivedTotalCents += amountCents;
      continue;
    }

    if (isFailed) {
      summary.failedCount += 1;
      summary.failedTotalCents += remainingCents || amountCents;
    } else {
      summary.pendingCount += 1;
      summary.pendingTotalCents += remainingCents || amountCents;
    }

    if (isOverdue) {
      summary.overdueCount += 1;
      summary.overdueTotalCents += remainingCents || amountCents;
    }

    summary.remainingCount += 1;
    summary.remainingTotalCents += remainingCents || amountCents;
  }

  summary.planIds = Array.from(planIds).sort();
  return summary;
}
