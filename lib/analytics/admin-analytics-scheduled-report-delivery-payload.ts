import type { AdminAnalyticsResolvedRange } from './admin-analytics-range';
import { adminAnalyticsRangeQueryString } from './admin-analytics-range';
import { analyticsFilename } from './admin-analytics-export-csv';
import {
  adminAnalyticsScheduledReportExportPath,
  type AdminAnalyticsScheduledReportCadence,
  type AdminAnalyticsScheduledReportType
} from './admin-analytics-scheduled-reports';
import { validateScheduledReportDryRunPreviewAggregateOnly } from './admin-analytics-scheduled-report-dry-run-preview';

export type AdminAnalyticsScheduledReportDeliveryPayloadPreviewStatus =
  | 'delivery_payload_preview_blocked'
  | 'delivery_payload_preview_materialized';
export type AdminAnalyticsScheduledReportDeliveryPayloadPreviewEnv = Readonly<Record<string, string | undefined>>;

export type AdminAnalyticsScheduledReportDeliveryPayloadAsset = {
  report: AdminAnalyticsScheduledReportType;
  exportPath: string;
  filename: string;
  contentType: 'text/csv';
  encoding: 'utf-8';
  byteLength: number;
  rowCount: number;
  csv: string;
  aggregateOnly: boolean;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportDeliveryPayloadPackage = {
  payloadVersion: 1;
  mode: 'owner-preview-only';
  reportId: string;
  cadence: AdminAnalyticsScheduledReportCadence;
  reportTypes: ['business', 'site'];
  rangeMode: AdminAnalyticsResolvedRange['mode'];
  rangeLabel: string;
  rangeQuery: string;
  generatedAt: string;
  payloadScope: 'aggregate-only';
  aggregateOnly: true;
  perCustomerRowsIncluded: false;
  deliveryExecutionEnabled: false;
  schedulerEnabled: false;
  backgroundJobEnabled: false;
  transportExecutionEnabled: false;
  assets: [AdminAnalyticsScheduledReportDeliveryPayloadAsset, AdminAnalyticsScheduledReportDeliveryPayloadAsset];
};

export type AdminAnalyticsScheduledReportDeliveryPayloadPreview = {
  status: AdminAnalyticsScheduledReportDeliveryPayloadPreviewStatus;
  ownerOnly: true;
  ownerAuthorized: boolean;
  runtimeEnabled: boolean;
  canMaterialize: boolean;
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
  payload: AdminAnalyticsScheduledReportDeliveryPayloadPackage | null;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportDeliveryPayloadEndpointPreview = {
  status: 'delivery_payload_preview_endpoint_blocked' | 'delivery_payload_preview_endpoint_owner_only_runtime_gated';
  routePath: '/admin/analytics/scheduled-reports/payload-preview';
  ownerOnly: true;
  ownerAuthorized: boolean;
  runtimeEnabled: boolean;
  payloadScope: 'aggregate-only';
  deliveryExecutionEnabled: false;
  schedulerEnabled: false;
  backgroundJobEnabled: false;
  transportExecutionEnabled: false;
  blockers: string[];
};

function flagEnabled(env: AdminAnalyticsScheduledReportDeliveryPayloadPreviewEnv, name: string) {
  return env[name] === 'true';
}

function reportIdValue(value?: string | null) {
  const id = value?.trim();
  return id && id.length > 0 ? id : null;
}

function csvRows(csv: string) {
  return csv.trim().length > 0 ? csv.trim().split(/\r?\n/) : [];
}

function csvByteLength(csv: string) {
  return new TextEncoder().encode(csv).length;
}

export function isScheduledReportDeliveryPayloadPreviewRuntimeEnabled(
  env: AdminAnalyticsScheduledReportDeliveryPayloadPreviewEnv = process.env
) {
  return flagEnabled(env, 'ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED');
}

export function loadScheduledReportDeliveryPayloadPreviewEndpointPreview(options: {
  isOwner: boolean;
  env?: AdminAnalyticsScheduledReportDeliveryPayloadPreviewEnv;
}): AdminAnalyticsScheduledReportDeliveryPayloadEndpointPreview {
  const env = options.env ?? process.env;
  const runtimeEnabled = isScheduledReportDeliveryPayloadPreviewRuntimeEnabled(env);
  const blockers = [
    ...(options.isOwner ? [] : ['owner admin role required']),
    ...(runtimeEnabled ? [] : ['delivery payload preview endpoint not enabled']),
    'delivery execution remains disabled',
    'scheduler execution remains disabled',
    'transport execution remains disabled'
  ];

  return {
    status: runtimeEnabled ? 'delivery_payload_preview_endpoint_owner_only_runtime_gated' : 'delivery_payload_preview_endpoint_blocked',
    routePath: '/admin/analytics/scheduled-reports/payload-preview',
    ownerOnly: true,
    ownerAuthorized: options.isOwner,
    runtimeEnabled,
    payloadScope: 'aggregate-only',
    deliveryExecutionEnabled: false,
    schedulerEnabled: false,
    backgroundJobEnabled: false,
    transportExecutionEnabled: false,
    blockers
  };
}

function buildAsset(report: AdminAnalyticsScheduledReportType, range: AdminAnalyticsResolvedRange, csv: string) {
  const rows = csvRows(csv);
  const validation = validateScheduledReportDryRunPreviewAggregateOnly(csv, report);
  return {
    report,
    exportPath: adminAnalyticsScheduledReportExportPath(report, range),
    filename: analyticsFilename(report, range),
    contentType: 'text/csv',
    encoding: 'utf-8',
    byteLength: csvByteLength(csv),
    rowCount: rows.length,
    csv,
    aggregateOnly: validation.aggregateOnly,
    blockers: validation.blockers
  } satisfies AdminAnalyticsScheduledReportDeliveryPayloadAsset;
}

export function buildScheduledReportDeliveryPayloadPreview(options: {
  isOwner: boolean;
  reportId?: string | null;
  cadence?: AdminAnalyticsScheduledReportCadence;
  range: AdminAnalyticsResolvedRange;
  businessCsv: string;
  siteCsv: string;
  generatedAt?: Date;
  env?: AdminAnalyticsScheduledReportDeliveryPayloadPreviewEnv;
}) {
  const env = options.env ?? process.env;
  const runtimeEnabled = isScheduledReportDeliveryPayloadPreviewRuntimeEnabled(env);
  const reportId = reportIdValue(options.reportId);
  const cadence = options.cadence ?? 'weekly';
  const generatedAt = options.generatedAt ?? new Date();
  const businessAsset = buildAsset('business', options.range, options.businessCsv);
  const siteAsset = buildAsset('site', options.range, options.siteCsv);
  const blockers = [
    ...(options.isOwner ? [] : ['owner admin role required']),
    ...(runtimeEnabled ? [] : ['delivery payload preview endpoint not enabled']),
    ...(reportId ? [] : ['scheduled-report id required']),
    ...businessAsset.blockers,
    ...siteAsset.blockers
  ];
  const canMaterialize = blockers.length === 0;
  const packageBase = {
    payloadVersion: 1,
    mode: 'owner-preview-only',
    reportId: reportId ?? '',
    cadence,
    reportTypes: ['business', 'site'],
    rangeMode: options.range.mode,
    rangeLabel: options.range.label,
    rangeQuery: adminAnalyticsRangeQueryString(options.range),
    generatedAt: generatedAt.toISOString(),
    payloadScope: 'aggregate-only',
    aggregateOnly: true,
    perCustomerRowsIncluded: false,
    deliveryExecutionEnabled: false,
    schedulerEnabled: false,
    backgroundJobEnabled: false,
    transportExecutionEnabled: false,
    assets: [businessAsset, siteAsset]
  } satisfies AdminAnalyticsScheduledReportDeliveryPayloadPackage;

  return {
    status: canMaterialize ? 'delivery_payload_preview_materialized' : 'delivery_payload_preview_blocked',
    ownerOnly: true,
    ownerAuthorized: options.isOwner,
    runtimeEnabled,
    canMaterialize,
    reportId,
    cadence,
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
    payload: canMaterialize ? packageBase : null,
    blockers
  } satisfies AdminAnalyticsScheduledReportDeliveryPayloadPreview;
}
