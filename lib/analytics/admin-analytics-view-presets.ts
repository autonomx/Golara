import {
  adminAnalyticsRangeQueryString,
  type AdminAnalyticsResolvedRange
} from './admin-analytics-range';

export type AdminAnalyticsViewPresetStatus = 'persistence_plan_only';
export type AdminAnalyticsViewPresetAudience = 'owner' | 'staff';
export type AdminAnalyticsViewScope = 'owner-private' | 'staff-shared' | 'store-wide-owner-managed';

export type AdminAnalyticsViewSection = {
  anchor: string;
  label: string;
};

export type AdminAnalyticsViewPreset = {
  key: string;
  label: string;
  description: string;
  audience: AdminAnalyticsViewPresetAudience;
  scope: AdminAnalyticsViewScope;
  rangeLabel: string;
  rangeQuery: string;
  href: string;
  sections: AdminAnalyticsViewSection[];
  allowedManagers: AdminAnalyticsViewPresetAudience[];
};

export type AdminAnalyticsViewPersistencePlan = {
  status: AdminAnalyticsViewPresetStatus;
  enabled: boolean;
  saveEndpointEnabled: boolean;
  updateEndpointEnabled: boolean;
  removeEndpointEnabled: boolean;
  managementUiEnabled: boolean;
  ownerApprovalRequired: boolean;
  ownerApprovalRecorded: boolean;
  allowedScopes: AdminAnalyticsViewScope[];
  requiredFields: string[];
  blockedFields: string[];
  blockers: string[];
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
  persistencePlan: AdminAnalyticsViewPersistencePlan;
  blockers: string[];
};

const VIEW_PRESETS = [
  {
    key: 'business-performance',
    label: 'Business performance view',
    description: 'Preview a dashboard view for revenue, orders, products, and category sales using the selected range.',
    audience: 'staff' as const,
    scope: 'staff-shared' as const,
    allowedManagers: ['owner'] as AdminAnalyticsViewPresetAudience[],
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
    scope: 'owner-private' as const,
    allowedManagers: ['owner'] as AdminAnalyticsViewPresetAudience[],
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
    scope: 'staff-shared' as const,
    allowedManagers: ['owner'] as AdminAnalyticsViewPresetAudience[],
    sections: [
      { anchor: 'order-analytics', label: 'Order cohorts' },
      { anchor: 'advanced-cohort-analytics', label: 'Advanced cohorts' },
      { anchor: 'business-analytics-charts', label: 'Chart context' }
    ]
  },
  {
    key: 'operations-readiness',
    label: 'Operations readiness view',
    description: 'Preview a dashboard view for inventory, fulfillment, payments, inquiries, and readiness checks.',
    audience: 'staff' as const,
    scope: 'store-wide-owner-managed' as const,
    allowedManagers: ['owner'] as AdminAnalyticsViewPresetAudience[],
    sections: [
      { anchor: 'inventory-analytics', label: 'Inventory' },
      { anchor: 'fulfillment-analytics', label: 'Fulfillment' },
      { anchor: 'payment-analytics', label: 'Payments' },
      { anchor: 'inquiry-operations', label: 'Inquiries' },
      { anchor: 'readiness-analytics', label: 'Readiness' }
    ]
  }
];

const VIEW_PERSISTENCE_PLAN: AdminAnalyticsViewPersistencePlan = {
  status: 'persistence_plan_only',
  enabled: false,
  saveEndpointEnabled: false,
  updateEndpointEnabled: false,
  removeEndpointEnabled: false,
  managementUiEnabled: false,
  ownerApprovalRequired: true,
  ownerApprovalRecorded: false,
  allowedScopes: ['owner-private', 'staff-shared', 'store-wide-owner-managed'],
  requiredFields: ['view key', 'view label', 'scope', 'selected range query', 'section anchors'],
  blockedFields: ['analytics rows', 'customer rows', 'raw event rows', 'customer contact fields'],
  blockers: [
    'owner approval not recorded',
    'view metadata model not implemented',
    'save endpoint not configured',
    'management UI not implemented',
    'role policy persistence not configured'
  ]
};

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
    status: 'persistence_plan_only',
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
    persistencePlan: {
      ...VIEW_PERSISTENCE_PLAN,
      allowedScopes: [...VIEW_PERSISTENCE_PLAN.allowedScopes],
      requiredFields: [...VIEW_PERSISTENCE_PLAN.requiredFields],
      blockedFields: [...VIEW_PERSISTENCE_PLAN.blockedFields],
      blockers: [...VIEW_PERSISTENCE_PLAN.blockers]
    },
    blockers: [...VIEW_PERSISTENCE_PLAN.blockers]
  };
}
