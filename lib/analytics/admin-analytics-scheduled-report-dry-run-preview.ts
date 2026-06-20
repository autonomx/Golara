import { adminAnalyticsRangeQueryString, type AdminAnalyticsResolvedRange } from './admin-analytics-range';
import {
  adminAnalyticsScheduledReportExportPath,
  type AdminAnalyticsScheduledReportCadence,
  type AdminAnalyticsScheduledReportType
} from './admin-analytics-scheduled-reports';

export type AdminAnalyticsScheduledReportDryRunPreviewStatus = 'dry_run_preview_blocked' | 'dry_run_preview_generated';
export type AdminAnalyticsScheduledReportDryRunPreviewEnv = Readonly<Record<string, string | undefined>>;

export type AdminAnalyticsScheduledReportCsvPreview = {
  report: AdminAnalyticsScheduledReportType;
  path: string;
  rowCount: number;
  byteLength: number;
  sampleRows: string[];
  aggregateOnly: boolean;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportDryRunPreview = {
  status: AdminAnalyticsScheduledReportDryRunPreviewStatus;
  ownerOnly: true;
  ownerAuthorized: boolean;
  runtimeEnabled: boolean;
  canRecord: boolean;
  reportId: string | null;
  cadence: AdminAnalyticsScheduledReportCadence;
  reportTypes: ['business', 'site'];
  payloadScope: 'aggregate-only';
  aggregateOnly: true;
  perCustomerRowsIncluded: false;
  deliveryExecutionEnabled: false;
  schedulerEnabled: false;
  backgroundJobEnabled: false;
  transportExecutionEnabled: false;
  rangeMode: AdminAnalyticsResolvedRange['mode'];
  rangeLabel: string;
  rangeQuery: string;
  generatedAt: string;
  businessCsv: AdminAnalyticsScheduledReportCsvPreview;
  siteCsv: AdminAnalyticsScheduledReportCsvPreview;
  blockers: string[];
  evidence: Record<string, unknown>;
};

export type AdminAnalyticsScheduledReportDryRunPreviewEndpointPreview = {
  status: 'dry_run_preview_endpoint_blocked' | 'dry_run_preview_endpoint_owner_only_runtime_gated';
  routePath: '/admin/analytics/scheduled-reports/dry-run-preview';
  ownerOnly: true;
  ownerAuthorized: boolean;
  runtimeEnabled: boolean;
  deliveryExecutionEnabled: false;
  schedulerEnabled: false;
  backgroundJobEnabled: false;
  transportExecutionEnabled: false;
  blockers: string[];
};

const CSV_HEADER = '"report","section","metric","label","value","currency","notes"';
const FORBIDDEN_AGGREGATE_ONLY_PATTERNS = [
  /\bcustomer[_ -]?email\b/i,
  /\bemail[_ -]?address\b/i,
  /\bphone[_ -]?number\b/i,
  /\bshipping[_ -]?address\b/i,
  /\bbilling[_ -]?address\b/i,
  /\bfirst[_ -]?name\b/i,
  /\blast[_ -]?name\b/i,
  /\bfull[_ -]?name\b/i
];

function flagEnabled(env: AdminAnalyticsScheduledReportDryRunPreviewEnv, name: string) {
  return env[name] === 'true';
}

function csvRows(csv: string) {
  return csv.trim().length > 0 ? csv.trim().split(/\r?\n/) : [];
}

function csvByteLength(csv: string) {
  return new TextEncoder().encode(csv).length;
}

function reportIdValue(value?: string | null) {
  const id = value?.trim();
  return id && id.length > 0 ? id : null;
}

export function isScheduledReportDryRunPreviewRuntimeEnabled(
  env: AdminAnalyticsScheduledReportDryRunPreviewEnv = process.env
) {
  return flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_PREVIEW_ENABLED');
}

export function loadScheduledReportDryRunPreviewEndpointPreview(options: {
  isOwner: boolean;
  env?: AdminAnalyticsScheduledReportDryRunPreviewEnv;
}): AdminAnalyticsScheduledReportDryRunPreviewEndpointPreview {
  const env = options.env ?? process.env;
  const runtimeEnabled = isScheduledReportDryRunPreviewRuntimeEnabled(env);
  const blockers = [
    ...(options.isOwner ? [] : ['owner admin role required']),
    ...(runtimeEnabled ? [] : ['dry-run preview endpoint not enabled']),
    'delivery execution remains disabled',
    'scheduler execution remains disabled',
    'transport execution remains disabled'
  ];

  return {
    status: runtimeEnabled ? 'dry_run_preview_endpoint_owner_only_runtime_gated' : 'dry_run_preview_endpoint_blocked',
    routePath: '/admin/analytics/scheduled-reports/dry-run-preview',
    ownerOnly: true,
    ownerAuthorized: options.isOwner,
    runtimeEnabled,
    deliveryExecutionEnabled: false,
    schedulerEnabled: false,
    backgroundJobEnabled: false,
    transportExecutionEnabled: false,
    blockers
  };
}

export function validateScheduledReportDryRunPreviewAggregateOnly(csv: string, report: AdminAnalyticsScheduledReportType) {
  const rows = csvRows(csv);
  const blockers: string[] = [];
  if (rows.length === 0) blockers.push(`${report} CSV preview is empty`);
  if (rows[0] !== CSV_HEADER) blockers.push(`${report} CSV preview header is not the aggregate analytics schema`);
  for (const pattern of FORBIDDEN_AGGREGATE_ONLY_PATTERNS) {
    if (pattern.test(csv)) blockers.push(`${report} CSV preview contains a forbidden per-customer field`);
  }
  return {
    report,
    aggregateOnly: blockers.length === 0,
    blockers
  };
}

function buildCsvPreview(report: AdminAnalyticsScheduledReportType, range: AdminAnalyticsResolvedRange, csv: string) {
  const rows = csvRows(csv);
  const validation = validateScheduledReportDryRunPreviewAggregateOnly(csv, report);
  return {
    report,
    path: adminAnalyticsScheduledReportExportPath(report, range),
    rowCount: rows.length,
    byteLength: csvByteLength(csv),
    sampleRows: rows.slice(0, 6),
    aggregateOnly: validation.aggregateOnly,
    blockers: validation.blockers
  } satisfies AdminAnalyticsScheduledReportCsvPreview;
}

export function buildScheduledReportDryRunPreview(options: {
  isOwner: boolean;
  reportId?: string | null;
  cadence?: AdminAnalyticsScheduledReportCadence;
  range: AdminAnalyticsResolvedRange;
  businessCsv: string;
  siteCsv: string;
  generatedAt?: Date;
  env?: AdminAnalyticsScheduledReportDryRunPreviewEnv;
}) {
  const env = options.env ?? process.env;
  const runtimeEnabled = isScheduledReportDryRunPreviewRuntimeEnabled(env);
  const reportId = reportIdValue(options.reportId);
  const generatedAt = options.generatedAt ?? new Date();
  const businessCsv = buildCsvPreview('business', options.range, options.businessCsv);
  const siteCsv = buildCsvPreview('site', options.range, options.siteCsv);
  const blockers = [
    ...(options.isOwner ? [] : ['owner admin role required']),
    ...(runtimeEnabled ? [] : ['dry-run preview endpoint not enabled']),
    ...(reportId ? [] : ['scheduled-report id required']),
    ...businessCsv.blockers,
    ...siteCsv.blockers
  ];
  const canRecord = blockers.length === 0;
  const evidence = {
    dryRunPreviewVersion: 1,
    dryRunGeneratedAt: generatedAt.toISOString(),
    reportId,
    cadence: options.cadence ?? 'weekly',
    selectedRangeQuery: adminAnalyticsRangeQueryString(options.range),
    rangeLabel: options.range.label,
    rangeMode: options.range.mode,
    reportTypes: ['business', 'site'],
    payloadScope: 'aggregate-only',
    aggregateOnly: true,
    perCustomerRowsIncluded: false,
    businessCsvPath: businessCsv.path,
    businessCsvRowCount: businessCsv.rowCount,
    businessCsvByteLength: businessCsv.byteLength,
    siteCsvPath: siteCsv.path,
    siteCsvRowCount: siteCsv.rowCount,
    siteCsvByteLength: siteCsv.byteLength,
    globalDisableControlConfirmed: true,
    ownerApprovalPolicyConfirmed: true,
    deliveryDisabledConfirmed: true,
    schedulerDisabledConfirmed: true,
    backgroundJobDisabledConfirmed: true,
    transportExecutionDisabledConfirmed: true,
    canRecord
  };

  return {
    status: canRecord ? 'dry_run_preview_generated' : 'dry_run_preview_blocked',
    ownerOnly: true,
    ownerAuthorized: options.isOwner,
    runtimeEnabled,
    canRecord,
    reportId,
    cadence: options.cadence ?? 'weekly',
    reportTypes: ['business', 'site'],
    payloadScope: 'aggregate-only',
    aggregateOnly: true,
    perCustomerRowsIncluded: false,
    deliveryExecutionEnabled: false,
    schedulerEnabled: false,
    backgroundJobEnabled: false,
    transportExecutionEnabled: false,
    rangeMode: options.range.mode,
    rangeLabel: options.range.label,
    rangeQuery: adminAnalyticsRangeQueryString(options.range),
    generatedAt: generatedAt.toISOString(),
    businessCsv,
    siteCsv,
    blockers,
    evidence
  } satisfies AdminAnalyticsScheduledReportDryRunPreview;
}
