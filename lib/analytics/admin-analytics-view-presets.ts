import {
  adminAnalyticsRangeQueryString,
  type AdminAnalyticsResolvedRange
} from './admin-analytics-range';

export type AdminAnalyticsViewPresetStatus = 'preview_only';
export type AdminAnalyticsViewPresetAudience = 'owner' | 'staff';

export type AdminAnalyticsViewSection = {
  anchor: string;
  label: string;
};

export type AdminAnalyticsViewPreset = {
  key: string;
  label: string;
  description: string;
  audience: AdminAnalyticsViewPresetAudience;
  rangeLabel: string;
  rangeQuery: string;
  href: string;
  sections: AdminAnalyticsViewSection[];
};

export type AdminAnalyticsViewPresetPreview = {
  status: AdminAnalyticsViewPresetStatus;
  enabled: boolean;
  saveEnabled: boolean;
  clientSaveEnabled: boolean;
  serverSaveEnabled: boolean;
  roleAware: boolean;
  rangeMode: AdminAnalyticsResolvedRange['mode'];
  rangeLabel: string;
  rangeQuery: string;
  workspaceHref: string;
  presets: AdminAnalyticsViewPreset[];
  blockers: string[];
};

const VIEW_PRESETS = [
  {
    key: 'business-performance',
    label: 'Business performance view',
    description: 'Preview a dashboard view for revenue, orders, products, and category sales using the selected range.',
    audience: 'staff' as const,
    sections: [
      { anchor: 'order-analytics', label: 'Business summary' },
      { anchor: 'business-analytics-charts', label: 'Business charts' },
      { anchor: 'product-sales-analytics', label: 'Product sales' },
      { anchor: 'category-sales-analytics', label: 'Category sales' }
    ]
  },
  {
    key: 'site-funnel',
    label: 'Site funnel view',
    description: 'Preview a dashboard view for site funnel analytics and owner-only diagnostics using the selected range.',
    audience: 'owner' as const,
    sections: [
      { anchor: 'site-analytics', label: 'Site funnel' },
      { anchor: 'analytics-privacy-retention', label: 'Policy guidance' },
      { anchor: 'site-analytics-retention-status', label: 'Status diagnostics' }
    ]
  },
  {
    key: 'order-cohorts',
    label: 'Order cohort view',
    description: 'Preview a dashboard view for aggregate order cohort cards and chart context.',
    audience: 'staff' as const,
    sections: [
      { anchor: 'order-analytics', label: 'Order cohorts' },
      { anchor: 'business-analytics-charts', label: 'Chart context' }
    ]
  },
  {
    key: 'operations-readiness',
    label: 'Operations readiness view',
    description: 'Preview a dashboard view for inventory, fulfillment, payments, inquiries, and readiness checks.',
    audience: 'staff' as const,
    sections: [
      { anchor: 'inventory-analytics', label: 'Inventory' },
      { anchor: 'fulfillment-analytics', label: 'Fulfillment' },
      { anchor: 'payment-analytics', label: 'Payments' },
      { anchor: 'inquiry-operations', label: 'Inquiries' },
      { anchor: 'readiness-analytics', label: 'Readiness' }
    ]
  }
];

function workspaceHref(range: AdminAnalyticsResolvedRange) {
  return `/admin/analytics?${adminAnalyticsRangeQueryString(range)}`;
}

function sectionHref(range: AdminAnalyticsResolvedRange, anchor: string) {
  return `${workspaceHref(range)}#${anchor}`;
}

export function buildAdminAnalyticsViewPresetPreview(
  range: AdminAnalyticsResolvedRange
): AdminAnalyticsViewPresetPreview {
  const rangeQuery = adminAnalyticsRangeQueryString(range);
  const baseHref = workspaceHref(range);

  return {
    status: 'preview_only',
    enabled: false,
    saveEnabled: false,
    clientSaveEnabled: false,
    serverSaveEnabled: false,
    roleAware: true,
    rangeMode: range.mode,
    rangeLabel: range.label,
    rangeQuery,
    workspaceHref: baseHref,
    presets: VIEW_PRESETS.map((preset) => ({
      ...preset,
      rangeLabel: range.label,
      rangeQuery,
      href: preset.sections[0] ? sectionHref(range, preset.sections[0].anchor) : baseHref,
      sections: preset.sections.map((section) => ({ ...section }))
    })),
    blockers: [
      'view save path not configured',
      'client save path disabled',
      'server save path disabled',
      'role policy not configured'
    ]
  };
}
