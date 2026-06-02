import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_IMPORT_EXPORT_JOB,
  buildImportExportJobSummary,
  digestImportExportValue,
  normalizeImportExportDigest,
  normalizeImportExportJobInput,
  normalizeImportExportJobKey,
  normalizeImportExportJobKind,
  normalizeImportExportJobStatus,
  normalizeImportExportJobTarget,
  normalizeImportExportMetadata,
  normalizeImportExportRowCount,
  normalizeImportExportUrl
} from '../../lib/settings/import-export-job-tracking';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runImportExportJobTrackingTests() {
  const service = source('lib/settings/import-export-job-tracking.ts');
  const panel = source('components/admin/AdminImportExportJobTrackingPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const migration = source('prisma/migrations/20260603130000_add_import_export_job_tracking/migration.sql');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(normalizeImportExportJobKey(' Product Export / June! '), 'product-export-june');
  assert.equal(normalizeImportExportJobKind('IMPORT'), 'import');
  assert.equal(normalizeImportExportJobKind('sync'), DEFAULT_IMPORT_EXPORT_JOB.kind);
  assert.equal(normalizeImportExportJobTarget('Customer Records'), 'customers');
  assert.equal(normalizeImportExportJobTarget('unknown'), DEFAULT_IMPORT_EXPORT_JOB.target);
  assert.equal(normalizeImportExportJobStatus('Completed With Errors'), 'completed_with_errors');
  assert.equal(normalizeImportExportJobStatus('waiting'), DEFAULT_IMPORT_EXPORT_JOB.status);
  assert.equal(normalizeImportExportRowCount('-4'), 0);
  assert.equal(normalizeImportExportRowCount('100000001'), 100000000);
  assert.equal(normalizeImportExportUrl('/admin/exports/products.csv'), '/admin/exports/products.csv');
  assert.equal(normalizeImportExportUrl('s3://bucket/products.csv'), 's3://bucket/products.csv');
  assert.equal(normalizeImportExportUrl('ftp://example.com/products.csv'), null);
  assert.deepEqual(normalizeImportExportMetadata('{"rows":5}'), { rows: 5 });
  assert.deepEqual(normalizeImportExportMetadata('[1,2]'), {});

  const digest = digestImportExportValue('stable csv payload');
  assert.equal(digest?.length, 64);
  assert.equal(normalizeImportExportDigest(digest?.toUpperCase()), digest);
  assert.equal(normalizeImportExportDigest('not-a-digest'), null);

  const normalized = normalizeImportExportJobInput({
    key: ' Product Import ',
    label: '  Product   import  ',
    description: '  Import rows  ',
    kind: 'Import',
    target: 'Products',
    status: 'Running',
    requestedBy: ' owner@example.com ',
    sourceFilename: ' products.csv ',
    sourceMimeType: ' text/csv ',
    inputValue: 'a,b,c',
    outputUrl: 'https://example.com/exports/result.csv',
    outputValue: 'result',
    totalRows: '10',
    processedRows: '12',
    failedRows: '2',
    errorMessage: '  two bad rows ',
    metadata: '{"dryRun":true}'
  });
  assert.equal(normalized.key, 'product-import');
  assert.equal(normalized.label, 'Product import');
  assert.equal(normalized.description, 'Import rows');
  assert.equal(normalized.kind, 'import');
  assert.equal(normalized.target, 'products');
  assert.equal(normalized.status, 'running');
  assert.equal(normalized.requestedBy, 'owner@example.com');
  assert.equal(normalized.sourceFilename, 'products.csv');
  assert.equal(normalized.sourceMimeType, 'text/csv');
  assert.equal(normalized.inputDigest, digestImportExportValue('a,b,c'));
  assert.equal(normalized.outputDigest, digestImportExportValue('result'));
  assert.equal(normalized.totalRows, 10);
  assert.equal(normalized.processedRows, 10);
  assert.equal(normalized.failedRows, 2);
  assert.equal(normalized.errorMessage, 'two bad rows');
  assert.deepEqual(normalized.metadata, { dryRun: true });

  const summary = buildImportExportJobSummary([
    { ...DEFAULT_IMPORT_EXPORT_JOB, key: 'done', label: 'Done', status: 'completed', kind: 'export', target: 'products', processedRows: 10, totalRows: 10 },
    { ...DEFAULT_IMPORT_EXPORT_JOB, key: 'bad', label: 'Bad', status: 'completed_with_errors', kind: 'import', target: 'orders', failedRows: 1, processedRows: 9, totalRows: 10 },
    { ...DEFAULT_IMPORT_EXPORT_JOB, key: 'run', label: 'Run', status: 'running', kind: 'export', target: 'media' }
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.running, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.attention, 1);
  assert.equal(summary.byKind.export, 2);
  assert.equal(summary.byTarget.orders, 1);
  assert.equal(summary.entries[0].key, 'run');

  assert.match(service, /export const IMPORT_EXPORT_JOB_KINDS/);
  assert.match(service, /export const IMPORT_EXPORT_JOB_TARGETS/);
  assert.match(service, /export const IMPORT_EXPORT_JOB_STATUSES/);
  assert.match(service, /digestImportExportValue/);
  assert.match(service, /normalizeImportExportJobInput/);
  assert.match(service, /buildImportExportJobSummary/);
  assert.match(service, /importExportJobTrackingService = \{/);
  assert.match(service, /recordAdminAuditLog/);
  assert.match(service, /ImportExportJob/);

  assert.match(panel, /export function AdminImportExportJobTrackingPanel/);
  assert.match(panel, /Import\/export job tracking/);
  assert.match(panel, /updateImportExportJobTrackingAction/);
  assert.match(panel, /IMPORT_EXPORT_JOB_STATUSES/);

  assert.match(fulfillmentPanel, /importExportJobTrackingService\.summary\(10\)/);
  assert.match(fulfillmentPanel, /AdminImportExportJobTrackingPanel/);

  assert.match(actions, /importExportJobTrackingService/);
  assert.match(actions, /updateImportExportJobTrackingAction/);
  assert.match(actions, /assertAdminRole\('owner'\)/);
  assert.match(actions, /status=import-export-job-tracking-updated/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ImportExportJob"/);
  assert.match(migration, /"kind" TEXT NOT NULL/);
  assert.match(migration, /"target" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL/);
  assert.match(migration, /"metadata" JSONB NOT NULL/);
  assert.match(migration, /ImportExportJob_status_created_idx/);

  assert.match(roadmap, /- \[x\] Add import\/export job tracking\./);

  console.log('import-export-job-tracking.test.ts passed');
}
