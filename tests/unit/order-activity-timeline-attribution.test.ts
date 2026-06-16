import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOrderActivityTimelineAttributionTests() {
  const helper = source('lib/checkout/admin-order-activity-timeline.ts');
  const repository = source('lib/checkout/admin-order-repository.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');
  const actions = source('app/admin/order-actions.ts');
  const roadmap = source('docs/digikala-style-payment-remaining-phases.md');

  assert.match(helper, /export type AdminOrderActivityTimelineSource = 'staff' \| 'system'/);
  assert.match(helper, /export function buildAdminOrderActivityAttribution/);
  assert.match(helper, /export function mapAdminOrderActivityTimeline/);
  assert.match(helper, /attributionLabel: 'System activity'/);
  assert.match(helper, /attributionLabel: role \? `\$\{label \?\? 'Admin'\} \/ \$\{role\}` : \(label \?\? 'Admin'\)/);

  assert.match(helper, /export type AdminOrderReversalKind = 'refund' \| 'void' \| 'cancellation' \| 'adjustment'/);
  assert.match(helper, /export type AdminOrderReversalStatus = 'pending' \| 'recorded' \| 'completed'/);
  assert.match(helper, /export function buildAdminOrderReversalStatusSummary/);
  assert.match(helper, /manualTransferRefundOperation/);
  assert.match(helper, /installmentReversalOperation/);
  assert.match(helper, /codAdjustmentOperation/);
  assert.match(helper, /const reversal = buildAdminOrderReversalStatusSummary\(event\)/);
  assert.match(helper, /\.\.\.\(reversal \? \{ reversal \} : \{\}\)/);

  assert.match(repository, /import \{ mapAdminOrderActivityTimeline \} from '@\/lib\/checkout\/admin-order-activity-timeline'/);
  assert.match(repository, /activityTimeline: mapAdminOrderActivityTimeline\(order\.timelineEvents\)/);
  assert.match(repository, /timelineEvents: \{ orderBy: \{ createdAt: 'desc' \} \}/);

  assert.match(detail, /order\.activityTimeline\.length === 0/);
  assert.match(detail, /order\.activityTimeline\.map\(\(event\) =>/);
  assert.match(detail, /event\.attributionLabel/);
  assert.match(detail, /event\.source/);
  assert.match(detail, /review order history with staff attribution/);

  assert.match(actions, /actorLabel: actor\.label/);
  assert.match(actions, /actorRole: actor\.role/);
  assert.match(actions, /type: 'staff_note'/);

  assert.match(roadmap, /Admin refund\/reversal status timeline classifies refund, void, cancellation, and adjustment events across payment lanes\./);
  assert.match(roadmap, /Start \*\*Phase P7 — method-level settlement summary\*\*/);

  console.log('order-activity-timeline-attribution.test.ts passed');
}
