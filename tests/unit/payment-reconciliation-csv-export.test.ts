import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { formatPaymentReconciliationCsv } from '../../lib/checkout/payment-reconciliation-csv-export';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentReconciliationCsvExportTests() {
  const helper = source('lib/checkout/payment-reconciliation-csv-export.ts');
  assert.match(helper, /export function formatPaymentReconciliationCsv/);
  assert.match(helper, /Method settlement summary/);
  assert.match(helper, /Manual transfer totals/);
  assert.match(helper, /Wallet liability balance/);
  assert.match(helper, /COD collection totals/);
  assert.match(helper, /Installment receivables/);
  assert.doesNotMatch(helper, /prisma\./, 'CSV export formatter must stay read-only and pure');

  const csv = formatPaymentReconciliationCsv({
    generatedAt: '2026-06-16T12:00:00.000Z',
    methodSummaries: [
      {
        methodKey: 'manual_transfer',
        methodLabel: 'Manual "bank" transfer',
        methodType: 'manual_transfer',
        provider: 'manual',
        currency: 'CAD',
        orderCount: 2,
        grossTotalCents: 12000,
        paidTotalCents: 5000,
        refundedTotalCents: 1000,
        outstandingTotalCents: 6000,
        statusCounts: { paid: 1, pending: 1, failed: 0, refunded: 0, cancelled: 0, other: 0 },
        rawStatusCounts: { received: 1, pending_review: 1 },
        totalCentsByStatus: { received: 5000, pending_review: 7000 },
        codCollectionStatuses: {},
        totalCentsByCodCollectionStatus: {},
        codSettlementModes: {},
        manualReviewRequiredCount: 1,
        timelineEvidenceCount: 1,
        latestEvidenceTitles: ['Manual transfer adjustment recorded']
      }
    ],
    manualTransferTotals: {
      methodKeys: ['manual_transfer'],
      currency: 'CAD',
      orderCount: 2,
      receivedCount: 1,
      pendingReviewCount: 1,
      needsFollowUpCount: 0,
      rejectedCount: 0,
      receivedTotalCents: 5000,
      pendingReviewTotalCents: 7000,
      needsFollowUpTotalCents: 0,
      rejectedTotalCents: 0,
      manualReviewRequiredCount: 1,
      timelineEvidenceCount: 1
    },
    walletLiability: {
      currency: 'TOMAN',
      walletCount: 2,
      availableLiabilityCents: 20000,
      reservedLiabilityCents: 3000,
      totalLiabilityCents: 23000,
      lifetimeCreditCents: 29000,
      lifetimeDebitCents: 6000,
      ledgerEntryCount: 6,
      latestWalletActivityAt: '2026-06-02T11:00:00.000Z',
      walletMethodKeys: ['wallet'],
      walletOrderCount: 2,
      walletCapturedTotalCents: 5000,
      walletRefundedTotalCents: 3000,
      walletOutstandingOrderTotalCents: 0,
      walletTimelineEvidenceCount: 1
    },
    codCollectionTotals: {
      methodKeys: ['cod'],
      currency: 'CAD',
      orderCount: 4,
      collectedCount: 1,
      pendingCollectionCount: 1,
      failedCollectionCount: 1,
      waivedCollectionCount: 1,
      collectedTotalCents: 9000,
      pendingCollectionTotalCents: 4000,
      failedCollectionTotalCents: 1500,
      waivedCollectionTotalCents: 2500,
      collectionStatuses: { collected: 1, pending: 1, failed: 1, waived: 1 },
      settlementModes: { driver_cash: 1, owner_waived: 1 },
      ownerAdjustmentEvidenceCount: 1,
      timelineEvidenceCount: 2
    },
    installmentReceivables: {
      currency: 'TOMAN',
      planIds: ['plan-1', 'plan-2'],
      entryCount: 3,
      paidCount: 1,
      pendingCount: 1,
      failedCount: 0,
      waivedCount: 1,
      overdueCount: 1,
      remainingCount: 1,
      paidTotalCents: 10000,
      pendingTotalCents: 12000,
      failedTotalCents: 0,
      waivedTotalCents: 5000,
      overdueTotalCents: 12000,
      remainingTotalCents: 12000,
      latestDueAt: '2026-07-01T00:00:00.000Z',
      nextDueAt: '2026-07-01T00:00:00.000Z'
    }
  });

  assert.match(csv, /"# Reconciliation export"/);
  assert.match(csv, /"# Method settlement summary"/);
  assert.match(csv, /"# Manual transfer totals"/);
  assert.match(csv, /"# Wallet liability balance"/);
  assert.match(csv, /"# COD collection totals"/);
  assert.match(csv, /"# Installment receivables"/);
  assert.match(csv, /"Manual ""bank"" transfer"/);
  assert.match(csv, /"manual_transfer"/);
  assert.match(csv, /"driver_cash":1/);
  assert.match(csv, /"plan-1\|plan-2"/);

  const roadmap = source('docs/digikala-style-payment-remaining-phases.md');
  assert.match(roadmap, /Exportable reconciliation CSV formatter emits method-level, manual-transfer, wallet, COD, and installment receivables summaries/);
  assert.match(roadmap, /Completed checkpoint: Start \*\*Phase P7 — exportable reconciliation CSVs\*\* is now complete/);
  assert.match(roadmap, /Start \*\*Phase P7 — admin reconciliation CSV route wiring\*\*/);

  console.log('payment-reconciliation-csv-export.test.ts passed');
}
