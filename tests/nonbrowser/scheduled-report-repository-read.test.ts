import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildAdminAnalyticsScheduledReportRepositoryContract,
  buildAdminAnalyticsScheduledReportRepositoryReadArgs,
  readAdminAnalyticsScheduledReportsFromRepository,
  type AdminAnalyticsScheduledReportRepositoryReadArgs
} from '../../lib/analytics/admin-analytics-scheduled-report-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function validRow() {
  return {
    id: 'report_1',
    reportKey: 'weekly-owner-analytics-config',
    label: 'Weekly owner analytics configuration',
    description: 'Owner report schedule',
    cadence: 'weekly',
    rangeMode: 'custom',
    rangeQuery: 'start=2026-06-01&end=2026-06-15',
    reportTypes: ['business', 'site', 'site'],
    ownerApproved: true,
    isActive: true,
    deliveryEnabled: false,
    lastDryRunSummary: { checkedAt: '2026-06-15T00:00:00.000Z' }
  };
}

export async function runScheduledReportRepositoryReadTests() {
  const contract = buildAdminAnalyticsScheduledReportRepositoryContract();
  assert.equal(contract.status, 'repository_read_contract_only');
  assert.equal(contract.enabled, false);
  assert.equal(contract.repositoryReadsEnabled, false);
  assert.equal(contract.repositoryWritesEnabled, false);
  assert.equal(contract.readAdapterAvailable, true);
  assert.equal(contract.readEndpointEnabled, false);
  assert.equal(contract.managementUiEnabled, false);
  assert.equal(contract.deliveryExecutionEnabled, false);
  assert.ok(contract.readPlan.selectFields.includes('rangeQuery'));
  assert.ok(contract.readPlan.selectFields.includes('reportTypes'));
  assert.ok(contract.readPlan.requiredFilters.some((filter) => filter.field === 'ownerApproved' && filter.expected === true));
  assert.ok(contract.readPlan.requiredFilters.some((filter) => filter.field === 'isActive' && filter.expected === true));
  assert.ok(contract.readPlan.requiredFilters.some((filter) => filter.field === 'deliveryEnabled' && filter.expected === false));

  const args = buildAdminAnalyticsScheduledReportRepositoryReadArgs(500);
  assert.equal(args.take, 50);
  assert.deepEqual(args.where, { ownerApproved: true, isActive: true, deliveryEnabled: false });
  assert.deepEqual(args.orderBy, [{ cadence: 'asc' }, { reportKey: 'asc' }]);
  assert.equal(args.select.id, true);
  assert.equal(args.select.reportKey, true);
  assert.equal(args.select.rangeQuery, true);
  assert.equal(args.select.reportTypes, true);
  assert.equal(args.select.lastDryRunSummary, true);
  assert.equal(args.select.deliveryEnabled, true);
  assert.equal(args.select.createdAt, true);
  assert.equal(args.select.updatedAt, true);

  let capturedArgs: AdminAnalyticsScheduledReportRepositoryReadArgs | undefined;
  const preview = await readAdminAnalyticsScheduledReportsFromRepository({
    readScheduledReportMetadata: async (readArgs) => {
      capturedArgs = readArgs;
      return [
        validRow(),
        { ...validRow(), id: 'report_2', cadence: 'daily' },
        { ...validRow(), id: 'report_3', reportTypes: ['unsafe'] }
      ];
    }
  }, 500);

  assert.deepEqual(capturedArgs, args);
  assert.equal(preview.status, 'repository_read_adapter_only');
  assert.equal(preview.enabled, false);
  assert.equal(preview.repositoryReadsEnabled, false);
  assert.equal(preview.deliveryExecutionEnabled, false);
  assert.equal(preview.rows.length, 1);
  assert.equal(preview.rows[0].activeForOperators, false);
  assert.equal(preview.rows[0].deliveryReady, false);
  assert.deepEqual(preview.rows[0].reportTypes, ['business', 'site']);
  assert.equal(preview.omittedRowCount, 2);

  const repositorySource = source('lib/analytics/admin-analytics-scheduled-report-repository.ts');
  assert.match(repositorySource, /readAdapterAvailable: true/);
  assert.match(repositorySource, /readScheduledReportMetadata/);
  assert.match(repositorySource, /ownerApproved: true/);
  assert.match(repositorySource, /isActive: true/);
  assert.match(repositorySource, /deliveryEnabled: false/);
  assert.match(repositorySource, /repositoryWritesEnabled: false/);
  assert.match(repositorySource, /readEndpointEnabled: false/);
  assert.match(repositorySource, /managementUiEnabled: false/);
  assert.match(repositorySource, /deliveryExecutionEnabled: false/);
  assert.doesNotMatch(repositorySource, /PrismaClient|prisma\.|
  \$queryRaw|create\(|update\(|upsert\(|delete\(|fetch\(|sendMail|transport|cron|schedule\.create|setInterval|setTimeout|\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b|localStorage|sessionStorage|cookies\(/);
  console.log('scheduled-report-repository-read.test.ts passed');
}
