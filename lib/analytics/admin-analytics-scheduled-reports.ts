import {
  adminAnalyticsRangeQueryString,
  type AdminAnalyticsResolvedRange
} from './admin-analytics-range';

export type AdminAnalyticsScheduledReportCadence = 'weekly' | 'monthly';
export type AdminAnalyticsScheduledReportType = 'business' | 'site';
export type AdminAnalyticsScheduledReportStatus = 'preview_only';

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
  blockers: string[];
};

export function adminAnalyticsScheduledReportExportPath(
  report: AdminAnalyticsScheduledReportType,
  range: AdminAnalyticsResolvedRange
) {
  return `/admin/analytics/export?${adminAnalyticsRangeQueryString(range, { report })}`;
}

export function buildAdminAnalyticsScheduledReportPreview(
  range: AdminAnalyticsResolvedRange
): AdminAnalyticsScheduledReportPreview {
  const rangeQuery = adminAnalyticsRangeQueryString(range);

  return {
    status: 'preview_only',
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
    blockers: [
      'schedule persistence not configured',
      'delivery channel not configured',
      'owner confirmation not recorded'
    ]
  };
}
