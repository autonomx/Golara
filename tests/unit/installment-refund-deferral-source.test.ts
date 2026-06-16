import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

for (const fragment of [
  'P3 cancellation/refund deferral decision',
  'Installment cancellation/refund workflow explicitly deferred to Phase P6',
  'No active cancellation/refund deliverable remains in P3',
  'Start **Phase P4 — COD selected-method state on orders**',
  'Installment cancellation/refund workflow (deferred from P3 after customer status and staff collection tracking)'
]) {
  assert.ok(roadmap.includes(fragment), `Expected installment refund deferral roadmap fragment: ${fragment}`);
}

assert.ok(
  pkg.includes('check:installment-refund-deferral'),
  'Expected package.json to expose installment refund deferral source guard',
);

console.log('installment-refund-deferral-source.test.ts passed');
