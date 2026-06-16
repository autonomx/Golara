import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const helper = readFileSync('lib/checkout/payment-method-settlement-summary.ts', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');

export async function runOfflineTransferTotalsSourceTests() {
  for (const fragment of [
    'export type ManualTransferSettlementTotals',
    'export function summarizeManualTransferSettlementTotals',
    'rawStatusCounts: Record<string, number>;',
    'totalCentsByStatus: Record<string, number>;',
    'MANUAL_TRANSFER_METHOD_KEYS',
    'methodKeys: string[];',
    'manualReviewRequiredCount += summary.manualReviewRequiredCount',
    'timelineEvidenceCount += summary.timelineEvidenceCount'
  ]) {
    assert.ok(helper.includes(fragment), `Expected offline-transfer totals fragment: ${fragment}`);
  }

  assert.doesNotMatch(helper, /prisma\./, 'offline transfer totals must stay read-only and pure');
  assert.ok(roadmap.includes('Manual-transfer settlement totals summarize received, pending-review, needs-follow-up, and rejected buckets.'));
  assert.ok(roadmap.includes('Start **Phase P7 — wallet liability balance**'));

  console.log('offline-transfer-totals-source.test.ts passed');
}
