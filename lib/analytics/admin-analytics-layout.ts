import {
  adminAnalyticsRangeQueryString,
  type AdminAnalyticsResolvedRange
} from './admin-analytics-range';

export type AdminAnalyticsLayoutPreviewStatus = 'collapsible_groups_active';
export type AdminAnalyticsLayoutGroupKey =
  | 'overview'
  | 'business'
  | 'site'
  | 'products'
  | 'operations'
  | 'privacy-docs';

export type AdminAnalyticsLayoutSection = {
  anchor: string;
  label: string;
  href: string;
  keepsTableFallback: boolean;
};

export type AdminAnalyticsLayoutGroup = {
  key: AdminAnalyticsLayoutGroupKey;
  label: string;
  description: string;
  href: string;
  defaultOpen: boolean;
  sections: AdminAnalyticsLayoutSection[];
};

export type AdminAnalyticsLayoutPreview = {
  status: AdminAnalyticsLayoutPreviewStatus;
  enabled: boolean;
  groupHeadersEnabled: boolean;
  collapsibleGroupsEnabled: boolean;
  tabsEnabled: boolean;
  preservesSectionIndex: boolean;
  preservesRangeLinks: boolean;
  requiresAccessibleTableFallbacks: boolean;
  rangeMode: AdminAnalyticsResolvedRange['mode'];
  rangeLabel: string;
  rangeQuery: string;
  workspaceHref: string;
  groups: AdminAnalyticsLayoutGroup[];
  blockers: string[];
};

type LayoutGroupDefinition = Omit<AdminAnalyticsLayoutGroup, 'href' | 'sections' | 'defaultOpen'> & {
  defaultOpen?: boolean;
  sections: Array<Omit<AdminAnalyticsLayoutSection, 'href' | 'keepsTableFallback'>>;
};

const LAYOUT_GROUPS: LayoutGroupDefinition[] = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Entry guidance, selected-range context, CSV exports, and the section index.',
    defaultOpen: true,
    sections: [
      { anchor: 'analytics-role-visibility', label: 'Role visibility' },
      { anchor: 'analytics-section-index', label: 'Section index' },
      { anchor: 'analytics-csv-exports', label: 'CSV exports' },
      { anchor: 'analytics-guidance', label: 'Guidance' }
    ]
  },
  {
    key: 'business',
    label: 'Business',
    description: 'Order summary, revenue trends, and business chart context.',
    sections: [
      { anchor: 'order-analytics', label: 'Order analytics' },
      { anchor: 'business-analytics-charts', label: 'Business charts' }
    ]
  },
  {
    key: 'site',
    label: 'Site',
    description: 'First-party site funnel, attribution, and storefront behavior signals.',
    sections: [
      { anchor: 'site-analytics', label: 'Site analytics' }
    ]
  },
  {
    key: 'products',
    label: 'Products and categories',
    description: 'Product conversion, product sales, and category sales panels.',
    sections: [
      { anchor: 'product-analytics', label: 'Product conversion' },
      { anchor: 'product-sales-analytics', label: 'Product sales' },
      { anchor: 'category-sales-analytics', label: 'Category sales' }
    ]
  },
  {
    key: 'operations',
    label: 'Operations',
    description: 'Inventory, fulfillment, payment, inquiry, and readiness panels.',
    sections: [
      { anchor: 'inventory-analytics', label: 'Inventory' },
      { anchor: 'fulfillment-analytics', label: 'Fulfillment' },
      { anchor: 'payment-analytics', label: 'Payments' },
      { anchor: 'inquiry-operations', label: 'Inquiries' },
      { anchor: 'readiness-analytics', label: 'Readiness' }
    ]
  },
  {
    key: 'privacy-docs',
    label: 'Privacy and docs',
    description: 'Privacy policy, retention status, cleanup preview, and operator documentation.',
    sections: [
      { anchor: 'analytics-privacy-retention', label: 'Privacy and retention' },
      { anchor: 'site-analytics-retention-status', label: 'Retention status' },
      { anchor: 'analytics-guidance', label: 'Documentation guidance' }
    ]
  }
];

function workspaceHref(range: AdminAnalyticsResolvedRange) {
  return `/admin/analytics?${adminAnalyticsRangeQueryString(range)}`;
}

function sectionHref(range: AdminAnalyticsResolvedRange, anchor: string) {
  return `${workspaceHref(range)}#${anchor}`;
}

export function buildAdminAnalyticsLayoutPreview(
  range: AdminAnalyticsResolvedRange
): AdminAnalyticsLayoutPreview {
  const rangeQuery = adminAnalyticsRangeQueryString(range);
  const baseHref = workspaceHref(range);

  return {
    status: 'collapsible_groups_active',
    enabled: true,
    groupHeadersEnabled: true,
    collapsibleGroupsEnabled: true,
    tabsEnabled: false,
    preservesSectionIndex: true,
    preservesRangeLinks: true,
    requiresAccessibleTableFallbacks: true,
    rangeMode: range.mode,
    rangeLabel: range.label,
    rangeQuery,
    workspaceHref: baseHref,
    groups: LAYOUT_GROUPS.map((group, index) => ({
      ...group,
      defaultOpen: group.defaultOpen ?? index < 2,
      href: group.sections[0] ? sectionHref(range, group.sections[0].anchor) : baseHref,
      sections: group.sections.map((section) => ({
        ...section,
        href: sectionHref(range, section.anchor),
        keepsTableFallback: true
      }))
    })),
    blockers: [
      'tabbed workspace behavior not implemented'
    ]
  };
}
