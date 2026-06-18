import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';
import {
  getReadinessCopy,
  readinessCardLabel,
  readinessIssueDetail,
  readinessIssueLine,
  readinessIssueSummary,
  readinessModeLine,
  readinessProvidersLine
} from '@/lib/localization/admin-readiness-copy';

const repoRoot = process.cwd();
const panelSource = readFileSync(join(repoRoot, 'components/admin/AdminReadinessPanel.tsx'), 'utf8');
const readinessCopySource = readFileSync(join(repoRoot, 'lib/localization/admin-readiness-copy.ts'), 'utf8');

const adminCopyKeys = [
  'Ready',
  'Needs decision',
  'Blocked',
  'Production readiness',
  'Launch checklist status',
  'Operational checks based on',
  'These cards are advisory and do not change CMS write permissions.',
  'Checklist doc',
  'Inquiry notification retry runbook'
];

for (const key of adminCopyKeys) {
  assert.ok(panelSource.includes(`t(${JSON.stringify(key)})`) || panelSource.includes(`t('${key.replace(/'/g, "\\'")}')`), `${key} must stay wrapped with the admin translator`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

const readinessLabels = ['Runtime mode', 'Database', 'Seed fallback policy', 'Admin auth'];
for (const key of readinessLabels) {
  assert.ok(panelSource.includes(`label: ${JSON.stringify(key)}`) || panelSource.includes(`label: '${key.replace(/'/g, "\\'")}'`), `${key} must stay in the readiness item list`);
  assert.notEqual(getReadinessCopy(key, 'fa'), key, `${key} must resolve to Persian readiness copy`);
}

const readinessFallbacks = [
  'Inquiry notifications are blocked.',
  'Fix notification blockers before relying on automated alerting.',
  'Inquiry notifications need an operating decision.',
  'Confirm the manual monitoring process before launch.',
  'Inquiry notification configuration is ready.',
  'Checkout readiness is blocked.',
  'Fix checkout configuration blockers before enabling gateway mode.',
  'Checkout readiness needs an operating decision.',
  'Confirm checkout mode and fallback process before launch.',
  'Checkout gateway configuration is ready.'
];

for (const key of readinessFallbacks) {
  assert.notEqual(getReadinessCopy(key, 'fa'), key, `${key} must resolve to Persian readiness copy`);
}

const screenshotRegressionStrings = [
  'Checkout remains inquiry-first.',
  'Products continue to route through inquiry/staff follow-up instead of direct payment.',
  'Inquiry notifications are log-only.',
  'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.',
  'checkout_inquiry_mode',
  'overseas_whatsapp_fallback',
  'notification_log_only',
  'manual',
  'inquiry',
  'log'
];

for (const key of screenshotRegressionStrings) {
  assert.notEqual(getReadinessCopy(key, 'fa'), key, `${key} must resolve to Persian readiness copy`);
}

const checkoutIssue = {
  code: 'checkout_inquiry_mode',
  summary: 'Checkout remains inquiry-first.',
  detail: 'Products continue to route through inquiry/staff follow-up instead of direct payment.'
};
const notificationIssue = {
  code: 'notification_log_only',
  summary: 'Inquiry notifications are log-only.',
  detail: 'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.'
};

assert.ok(readinessIssueSummary(checkoutIssue, 'Checkout readiness needs an operating decision.', 'fa').includes('پرداخت'), 'checkout issue summary must localize to Persian');
assert.ok(readinessIssueDetail(checkoutIssue, 'Confirm checkout mode and fallback process before launch.', 'fa').includes('محصولات'), 'checkout issue detail must localize to Persian');
assert.ok(readinessIssueLine(checkoutIssue, 'fa').includes('حالت درخواست مشتری'), 'checkout issue code must localize to Persian');
assert.ok(readinessIssueSummary(notificationIssue, 'Inquiry notifications need an operating decision.', 'fa').includes('اعلان'), 'notification issue summary must localize to Persian');
assert.ok(readinessIssueDetail(notificationIssue, 'Confirm the manual monitoring process before launch.', 'fa').includes('صندوق'), 'notification issue detail must localize to Persian');
assert.ok(readinessIssueLine(notificationIssue, 'fa').includes('اعلان ها'), 'notification issue code must localize to Persian');
assert.equal(readinessModeLine('inquiry', 'fa'), 'حالت: درخواست مشتری');
assert.equal(readinessProvidersLine(['manual'], 'fa'), 'ارائه دهندگان: دستی');
assert.equal(readinessCardLabel('Checkout', 'inquiry', 'fa'), 'پرداخت (درخواست مشتری)');
assert.equal(readinessCardLabel('Inquiry notifications', 'log', 'fa'), 'اعلان های درخواست مشتری (ثبت در گزارش ها)');

const readinessHelpers = [
  'runtimeModeSummary',
  'runtimeModeDetail',
  'databaseSummary',
  'databaseDetail',
  'seedFallbackSummary',
  'seedFallbackDetail',
  'adminAuthSummary',
  'adminAuthDetail',
  'notificationReadyDetail',
  'checkoutReadyDetail',
  'readinessIssueSummary',
  'readinessIssueDetail',
  'readinessIssueLine',
  'readinessCardLabel'
];
for (const helper of readinessHelpers) {
  assert.ok(panelSource.includes(`${helper}(`), `${helper} must remain wired into the readiness panel`);
}

assert.ok(panelSource.includes('createAdminTranslator(locale)'), 'readiness panel must create the admin translator from the provided locale');
assert.ok(panelSource.includes('t(item.label)'), 'readiness item labels must stay wrapped with the admin translator');
assert.ok(panelSource.includes('t(statusLabels[item.status])'), 'readiness status badges must stay wrapped with the admin translator');
assert.ok(panelSource.includes('t(item.summary)'), 'readiness summaries must stay wrapped with the admin translator');
assert.ok(panelSource.includes('t(item.detail)'), 'readiness details must stay wrapped with the admin translator');
assert.ok(readinessCopySource.includes("'Admin auth'"), 'readiness helper copy must cover Admin auth');

const forbiddenRawJsx = [
  '>Production readiness<',
  '>Launch checklist status<',
  '>Checklist doc<',
  '>Inquiry notification retry runbook<',
  '>Ready<',
  '>Needs decision<',
  '>Blocked<' 
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!panelSource.includes(fragment), `readiness panel must not render raw copy fragment ${fragment}`);
}

console.log('admin readiness panel copy guard passed');
