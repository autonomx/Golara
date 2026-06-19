import {
  adminAnalyticsRangeQueryString,
  type AdminAnalyticsResolvedRange
} from './admin-analytics-range';

export type AdminAnalyticsScheduledReportCadence = 'weekly' | 'monthly';
export type AdminAnalyticsScheduledReportType = 'business' | 'site';
export type AdminAnalyticsScheduledReportStatus = 'preview_only' | 'config_plan_only';
export type AdminAnalyticsScheduledReportConfigStatus = 'draft_only';

export type AdminAnalyticsScheduledReportPlan = {
  key: string;
  cadence: AdminAnalyticsScheduledReportCadence;
  label: string;
  description: string;
  reports: AdminAnalyticsScheduledReportType[];
  rangeLabel: string;
  deliveryEnabled: boolean;
  persistenceEnabled: boolean;
  nextRunLabel: string;
};

export type AdminAnalyticsScheduledReportConfigPlan = {
  key: string;
  status: AdminAnalyticsScheduledReportConfigStatus;
  cadence: AdminAnalyticsScheduledReportCadence;
  label: string;
  ownerOnly: boolean;
  ownerApprovalRequired: boolean;
  ownerApproved: boolean;
  active: boolean;
  deliveryEnabled: boolean;
  persistenceEnabled: boolean;
  reportTypes: AdminAnalyticsScheduledReportType[];
  rangeMode: AdminAnalyticsResolvedRange['mode'];
  rangeLabel: string;
  rangeQuery: string;
  businessCsvPath: string;
  siteCsvPath: string;
  activationRequirements: string[];
};

export type AdminAnalyticsScheduledReportPreview = {
  status: AdminAnalyticsScheduledReportStatus;
  enabled: boolean;
  ownerOnly: boolean;
  deliveryEnabled: boolean;
  persistenceEnabled: boolean;
  rangeMode: AdminAnalyticsResolvedRange['mode'];
  rangeLabel: string;
  rangeQuery: string;
  businessCsvPath: string;
  siteCsvPath: string;
  plans: AdminAnalyticsScheduledReportPlan[];
  configPlans: AdminAnalyticsScheduledReportConfigPlan[];
  blockers: string[];
};

export function adminAnalyticsScheduledReportExportPath(
  report: AdminAnalyticsScheduledReportType,
  range: AdminAnalyticsResolvedRange
) {
  return `/admin/analytics/export?${adminAnalyticsRangeQueryString(range, { report })}`;
}

function buildAdminAnalyticsScheduledReportConfigPlan(
  cadence: AdminAnalyticsScheduledReportCadence,
  range: AdminAnalyticsResolvedRange
): AdminAnalyticsScheduledReportConfigPlan {
  const labelPrefix = cadence === 'weekly' ? 'Weekly' : 'Monthly';
  const rangeQuery = adminAnalyticsRangeQueryString(range);

  return {
    key: `${cadence}-owner-analytics-config`,
    status: 'draft_only',
    cadence,
    label: `${labelPrefix} owner analytics configuration`,
    ownerOnly: true,
    ownerApprovalRequired: true,
    ownerApproved: false,
    active: false,
    deliveryEnabled: false,
    persistenceEnabled: false,
    reportTypes: ['business', 'site'],
    rangeMode: range.mode,
    rangeLabel: range.label,
    rangeQuery,
    businessCsvPath: adminAnalyticsScheduledReportExportPath('business', range),
    siteCsvPath: adminAnalyticsScheduledReportExportPath('site', range),
    activationRequirements: [
      'owner approval must be recorded',
      'schedule storage must be implemented',
      'delivery channel must be configured',
      'dry-run evidence must be captured'
    ]
  };
}

export function buildAdminAnalyticsScheduledReportPreview(
  range: AdminAnalyticsResolvedRange
): AdminAnalyticsScheduledReportPreview {
  const rangeQuery = adminAnalyticsRangeQueryString(range);
  const configPlans = [
    buildAdminAnalyticsScheduledReportConfigPlan('weekly', range),
    buildAdminAnalyticsScheduledReportConfigPlan('monthly', range)
  ];

  return {
    status: 'config_plan_only',
    enabled: false,
    ownerOnly: true,
    deliveryEnabled: false,
    persistenceEnabled: false,
    rangeMode: range.mode,
    rangeLabel: range.label,
    rangeQuery,
    businessCsvPath: adminAnalyticsScheduledReportExportPath('business', range),
    siteCsvPath: adminAnalyticsScheduledReportExportPath('site', range),
    plans: [
      {
        key: 'weekly-owner-analytics',
        cadence: 'weekly',
        label: 'Weekly owner analytics report',
        description: 'Preview a weekly owner report using the selected dashboard range and aggregate business/site CSV payloads.',
        reports: ['business', 'site'],
        rangeLabel: range.label,
        deliveryEnabled: false,
        persistenceEnabled: false,
        nextRunLabel: 'Not scheduled'
      },
      {
        key: 'monthly-owner-analytics',
        cadence: 'monthly',
        label: 'Monthly owner analytics report',
        description: 'Preview a monthly owner report using the selected dashboard range and aggregate business/site CSV payloads.',
        reports: ['business', 'site'],
        rangeLabel: range.label,
        deliveryEnabled: false,
        persistenceEnabled: false,
        nextRunLabel: 'Not scheduled'
      }
    ],
    configPlans,
    blockers: [
      'schedule persistence not configured',
      'delivery channel not configured',
      'owner confirmation not recorded',
      'dry-run evidence not recorded'
    ]
  };
}
