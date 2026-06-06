import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP38RollupTests() {
  const rollupDoc = readFileSync('docs/phase38-rollup.md', 'utf8');
  const closeoutDoc = readFileSync('docs/phase38-closeout.md', 'utf8');
  const implementationPlanDoc = readFileSync('docs/phase38-implementation-plan.md', 'utf8');
  const structuredLoggingDoc = readFileSync('docs/phase38-structured-logging-plan.md', 'utf8');
  const incidentRunbookDoc = readFileSync('docs/phase38-incident-runbook-plan.md', 'utf8');
  const healthCheckDoc = readFileSync('docs/phase38-health-check-inventory-plan.md', 'utf8');

  for (const marker of ['PR 351', 'PR 352', 'PR 354', 'PR 355', 'phase: 38', 'runtime: false', 'storage: false', 'delivery: false', 'external_calls: false']) {
    assert.ok(rollupDoc.includes(marker), `rollup doc must include ${marker}`);
  }

  for (const marker of [
    'planning/readiness closeout only',
    'PR 351',
    'PR 352',
    'PR 354',
    'PR 355',
    'PR 356',
    'PR 357',
    'next_phase_planning_required: true',
    'implementation_plan_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
  ]) {
    assert.ok(closeoutDoc.includes(marker), `closeout doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only implementation handoff',
    'structured logging plan',
    'incident runbook planning',
    'health-check inventory planning',
    'performance-pass planning',
    'implementation_plan_required: true',
    'branch_per_slice_required: true',
    'exact_head_ci_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
    'operator_actions_enabled: false',
    'live behavior changes',
  ]) {
    assert.ok(implementationPlanDoc.includes(marker), `implementation plan doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only logging handoff',
    'checkout',
    'payments',
    'webhooks',
    'notifications',
    'admin writes',
    'event_name_required: true',
    'request_correlation_required: true',
    'secret_values_allowed: false',
    'customer_pii_allowed: false',
    'payment_sensitive_data_allowed: false',
    'live log emission',
  ]) {
    assert.ok(structuredLoggingDoc.includes(marker), `structured logging doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only incident response handoff',
    'payment failure',
    'provider outage',
    'webhook backlog',
    'notification outage',
    'migration rollback',
    'incident_domain_required: true',
    'severity_required: true',
    'detection_signal_required: true',
    'secret_values_allowed: false',
    'live_operator_action_allowed: false',
    'live incident execution',
  ]) {
    assert.ok(incidentRunbookDoc.includes(marker), `incident runbook doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only health-check inventory handoff',
    'storefront',
    'admin',
    'database',
    'media storage',
    'provider dependencies',
    'health_domain_required: true',
    'dependency_name_required: true',
    'readiness_signal_required: true',
    'secret_values_allowed: false',
    'live_probe_allowed: false',
    'live health probes',
  ]) {
    assert.ok(healthCheckDoc.includes(marker), `health-check doc must include ${marker}`);
  }

  console.log('p38-rollup.test.ts passed');
}
