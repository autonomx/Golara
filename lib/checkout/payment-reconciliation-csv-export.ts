import type {
  CodCollectionSettlementTotals,
  InstallmentReceivablesSummary,
  ManualTransferSettlementTotals,
  MethodSettlementSummary,
  WalletLiabilityBalance
} from '@/lib/checkout/payment-method-settlement-summary';

export type PaymentReconciliationCsvInput = {
  generatedAt?: Date | string | null;
  methodSummaries?: MethodSettlementSummary[];
  manualTransferTotals?: ManualTransferSettlementTotals | null;
  walletLiability?: WalletLiabilityBalance | null;
  codCollectionTotals?: CodCollectionSettlementTotals | null;
  installmentReceivables?: InstallmentReceivablesSummary | null;
};

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function generatedAtIso(value?: Date | string | null) {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function csvLine(row: unknown[]) {
  return row.map(csvCell).join(',');
}

function section(title: string, header: string[], rows: unknown[][]) {
  return [[`# ${title}`], header, ...rows, []];
}

function methodSummaryRows(summaries: MethodSettlementSummary[]) {
  return summaries.map((summary) => [
    summary.methodKey,
    summary.methodLabel,
    summary.methodType,
    summary.provider,
    summary.currency,
    summary.orderCount,
    summary.grossTotalCents,
    summary.paidTotalCents,
    summary.refundedTotalCents,
    summary.outstandingTotalCents,
    summary.manualReviewRequiredCount,
    summary.timelineEvidenceCount
  ]);
}

function manualTransferRows(totals?: ManualTransferSettlementTotals | null) {
  if (!totals) return [];
  return [[
    totals.methodKeys.join('|'),
    totals.currency,
    totals.orderCount,
    totals.receivedCount,
    totals.pendingReviewCount,
    totals.needsFollowUpCount,
    totals.rejectedCount,
    totals.receivedTotalCents,
    totals.pendingReviewTotalCents,
    totals.needsFollowUpTotalCents,
    totals.rejectedTotalCents,
    totals.manualReviewRequiredCount,
    totals.timelineEvidenceCount
  ]];
}

function walletLiabilityRows(liability?: WalletLiabilityBalance | null) {
  if (!liability) return [];
  return [[
    liability.currency,
    liability.walletCount,
    liability.availableLiabilityCents,
    liability.reservedLiabilityCents,
    liability.totalLiabilityCents,
    liability.lifetimeCreditCents,
    liability.lifetimeDebitCents,
    liability.ledgerEntryCount,
    liability.walletMethodKeys.join('|'),
    liability.walletOrderCount,
    liability.walletCapturedTotalCents,
    liability.walletRefundedTotalCents,
    liability.walletOutstandingOrderTotalCents,
    liability.walletTimelineEvidenceCount,
    liability.latestWalletActivityAt || ''
  ]];
}

function codCollectionRows(totals?: CodCollectionSettlementTotals | null) {
  if (!totals) return [];
  return [[
    totals.methodKeys.join('|'),
    totals.currency,
    totals.orderCount,
    totals.collectedCount,
    totals.pendingCollectionCount,
    totals.failedCollectionCount,
    totals.waivedCollectionCount,
    totals.collectedTotalCents,
    totals.pendingCollectionTotalCents,
    totals.failedCollectionTotalCents,
    totals.waivedCollectionTotalCents,
    JSON.stringify(totals.collectionStatuses),
    JSON.stringify(totals.settlementModes),
    totals.ownerAdjustmentEvidenceCount,
    totals.timelineEvidenceCount
  ]];
}

function installmentReceivableRows(summary?: InstallmentReceivablesSummary | null) {
  if (!summary) return [];
  return [[
    summary.planIds.join('|'),
    summary.currency,
    summary.entryCount,
    summary.paidCount,
    summary.pendingCount,
    summary.failedCount,
    summary.waivedCount,
    summary.overdueCount,
    summary.remainingCount,
    summary.paidTotalCents,
    summary.pendingTotalCents,
    summary.failedTotalCents,
    summary.waivedTotalCents,
    summary.overdueTotalCents,
    summary.remainingTotalCents,
    summary.latestDueAt || '',
    summary.nextDueAt || ''
  ]];
}

export function formatPaymentReconciliationCsv(input: PaymentReconciliationCsvInput) {
  const rows: unknown[][] = [
    ['# Reconciliation export'],
    ['Generated at', generatedAtIso(input.generatedAt)],
    [],
    ...section(
      'Method settlement summary',
      [
        'Method key',
        'Method label',
        'Method type',
        'Provider',
        'Currency',
        'Orders',
        'Gross cents',
        'Paid cents',
        'Refunded cents',
        'Outstanding cents',
        'Manual review count',
        'Timeline evidence count'
      ],
      methodSummaryRows(input.methodSummaries || [])
    ),
    ...section(
      'Manual transfer totals',
      [
        'Method keys',
        'Currency',
        'Orders',
        'Received count',
        'Pending review count',
        'Needs follow-up count',
        'Rejected count',
        'Received cents',
        'Pending review cents',
        'Needs follow-up cents',
        'Rejected cents',
        'Manual review required count',
        'Timeline evidence count'
      ],
      manualTransferRows(input.manualTransferTotals)
    ),
    ...section(
      'Wallet liability balance',
      [
        'Currency',
        'Wallet count',
        'Available liability cents',
        'Reserved liability cents',
        'Total liability cents',
        'Lifetime credit cents',
        'Lifetime debit cents',
        'Ledger entry count',
        'Wallet method keys',
        'Wallet order count',
        'Wallet captured cents',
        'Wallet refunded cents',
        'Wallet outstanding order cents',
        'Wallet timeline evidence count',
        'Latest wallet activity at'
      ],
      walletLiabilityRows(input.walletLiability)
    ),
    ...section(
      'COD collection totals',
      [
        'Method keys',
        'Currency',
        'Orders',
        'Collected count',
        'Pending collection count',
        'Failed collection count',
        'Waived collection count',
        'Collected cents',
        'Pending collection cents',
        'Failed collection cents',
        'Waived collection cents',
        'Collection statuses',
        'Settlement modes',
        'Owner adjustment evidence count',
        'Timeline evidence count'
      ],
      codCollectionRows(input.codCollectionTotals)
    ),
    ...section(
      'Installment receivables',
      [
        'Plan IDs',
        'Currency',
        'Entries',
        'Paid count',
        'Pending count',
        'Failed count',
        'Waived count',
        'Overdue count',
        'Remaining count',
        'Paid cents',
        'Pending cents',
        'Failed cents',
        'Waived cents',
        'Overdue cents',
        'Remaining cents',
        'Latest due at',
        'Next due at'
      ],
      installmentReceivableRows(input.installmentReceivables)
    )
  ];

  return rows.map(csvLine).join('\n');
}
