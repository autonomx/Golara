import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/AdminOrderRevenueSummaryPanel.tsx', 'utf8');

const labels = [
  'eyebrow',
  'title',
  'body',
  'totalOrders',
  'revenue',
  'excludesCancelledRefunded',
  'averageOrderValue',
  'openOrders',
  'recentOrders',
  'recentRevenue',
  'last30Days',
  'completed',
  'cancelled',
  'currency',
  'orders',
  'aov'
];

for (const locale of ['en', 'fa']) {
  assert.match(source, new RegExp(`${locale}:\\s*{[\\s\\S]*?eyebrow:`), `expected ${locale} order revenue copy map`);

  for (const label of labels) {
    assert.match(
      source,
      new RegExp(`${locale}:\\s*{[\\s\\S]*?${label}:\\s*'[^']+'`),
      `expected ${locale}.${label} order revenue copy`
    );
  }
}

for (const usage of [
  'labels.eyebrow',
  'labels.title',
  'labels.body',
  'labels.totalOrders',
  'labels.revenue',
  'labels.excludesCancelledRefunded',
  'labels.averageOrderValue',
  'labels.openOrders',
  'labels.recentOrders',
  'labels.recentRevenue',
  'labels.last30Days',
  'labels.completed',
  'labels.cancelled',
  'labels.currency',
  'labels.orders',
  'labels.aov'
]) {
  assert.match(source, new RegExp(usage.replace('.', '\\.')), `expected ${usage} usage`);
}

assert.match(source, /resolveStorefrontLocale\(\)/, 'expected locale resolution');
assert.match(source, /copy\[localeKey\(locale\)\]/, 'expected locale-keyed copy lookup');

for (const rawText of [
  '>Analytics<',
  '>Order count and revenue<',
  '>Total orders<',
  '>Average order value<',
  '>Open orders<',
  '>Recent revenue<',
  '>Currency<',
  '>Orders<'
]) {
  assert.ok(!source.includes(rawText), `expected no direct JSX text ${rawText}`);
}
