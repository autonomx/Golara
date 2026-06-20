export type AdminAnalyticsScheduledReportManagementSurfaceStatus = 'management_surface_visible_runtime_disabled';

export type AdminAnalyticsScheduledReportManagementSurfaceApprovedPostEndpoint =
  | '/admin/analytics/scheduled-reports/record-dry-run'
  | '/admin/analytics/scheduled-reports/record-owner-approval'
  | '/admin/analytics/scheduled-reports/record-disable-state';

export const ADMIN_ANALYTICS_SCHEDULED_REPORT_MANAGEMENT_APPROVED_POST_ENDPOINTS = [
  '/admin/analytics/scheduled-reports/record-dry-run',
  '/admin/analytics/scheduled-reports/record-owner-approval',
  '/admin/analytics/scheduled-reports/record-disable-state'
] as const satisfies readonly AdminAnalyticsScheduledReportManagementSurfaceApprovedPostEndpoint[];

export type AdminAnalyticsScheduledReportManagementSurfaceControl = {
  key:
    | 'list-scheduled-reports'
    | 'record-dry-run-evidence'
    | 'record-owner-approval'
    | 'record-global-disable-state'
    | 'activate-schedule'
    | 'run-delivery';
  label: string;
  enabled: boolean;
  reason: string;
  actionPath?: AdminAnalyticsScheduledReportManagementSurfaceApprovedPostEndpoint;
  method?: 'post';
  submitLabel?: string;
};

export type AdminAnalyticsScheduledReportManagementSurfaceContract = {
  status: AdminAnalyticsScheduledReportManagementSurfaceStatus;
  routePath: '/admin/analytics/scheduled-reports';
  ownerOnly: true;
  visibleToOwner: boolean;
  visibleToStaff: boolean;
  repositoryReadPathEnabled: boolean;
  repositoryWritePathEnabled: boolean;
  readEndpointEnabled: boolean;
  writeEndpointEnabled: boolean;
  managementControlsEnabled: boolean;
  schedulerEnabled: boolean;
  deliveryExecutionEnabled: boolean;
  controls: AdminAnalyticsScheduledReportManagementSurfaceControl[];
  requiredBeforeActivation: string[];
};

const DISABLED_CONTROLS: AdminAnalyticsScheduledReportManagementSurfaceControl[] = [
  {
    key: 'list-scheduled-reports',
    label: 'List approved scheduled reports',
    enabled: false,
    reason: 'Read repository activation remains gated and is not called by the management surface.'
  },
  {
    key: 'record-dry-run-evidence',
    label: 'Record dry-run evidence',
    enabled: false,
    reason: 'Dry-run evidence recording remains locked until explicit recording runtime gates are enabled.',
    actionPath: '/admin/analytics/scheduled-reports/record-dry-run',
    method: 'post',
    submitLabel: 'Record dry-run evidence'
  },
  {
    key: 'record-owner-approval',
    label: 'Record owner approval',
    enabled: false,
    reason: 'Owner approval recording remains locked until explicit owner approval runtime gates are enabled.',
    actionPath: '/admin/analytics/scheduled-reports/record-owner-approval',
    method: 'post',
    submitLabel: 'Record owner approval'
  },
  {
    key: 'record-global-disable-state',
    label: 'Record global disable state',
    enabled: false,
    reason: 'Global disable state recording remains locked until explicit operational runtime gates are enabled.',
    actionPath: '/admin/analytics/scheduled-reports/record-disable-state',
    method: 'post',
    submitLabel: 'Record disable state'
  },
  {
    key: 'activate-schedule',
    label: 'Activate scheduled report',
    enabled: false,
    reason: 'Schedule activation remains blocked until owner approval and dry-run evidence recording are live.'
  },
  {
    key: 'run-delivery',
    label: 'Run delivery',
    enabled: false,
    reason: 'Delivery execution remains blocked until scheduler and transport are separately approved.'
  }
];

export function buildAdminAnalyticsScheduledReportManagementSurfaceContract(options: {
  isOwner: boolean;
}): AdminAnalyticsScheduledReportManagementSurfaceContract {
  return {
    status: 'management_surface_visible_runtime_disabled',
    routePath: '/admin/analytics/scheduled-reports',
    ownerOnly: true,
    visibleToOwner: options.isOwner,
    visibleToStaff: !options.isOwner,
    repositoryReadPathEnabled: false,
    repositoryWritePathEnabled: false,
    readEndpointEnabled: false,
    writeEndpointEnabled: false,
    managementControlsEnabled: false,
    schedulerEnabled: false,
    deliveryExecutionEnabled: false,
    controls: DISABLED_CONTROLS,
    requiredBeforeActivation: [
      'enable read-only repository access behind the kill switch',
      'record dry-run evidence through the gated recording repository',
      'record owner approval through the gated recording repository',
      'record global disable state before schedule activation',
      'keep owner-only API endpoints guarded with runtime gates and audit checks',
      'add scheduler and delivery execution in separate reviewed slices'
    ]
  };
}

export const buildScheduledReportManagementSurfaceContract = buildAdminAnalyticsScheduledReportManagementSurfaceContract;
