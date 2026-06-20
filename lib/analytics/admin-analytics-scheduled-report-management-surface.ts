export type AdminAnalyticsScheduledReportManagementSurfaceStatus = 'management_surface_visible_runtime_disabled';

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
    reason: 'Dry-run evidence recording requires an explicit write activation slice.'
  },
  {
    key: 'record-owner-approval',
    label: 'Record owner approval',
    enabled: false,
    reason: 'Owner approval recording requires an explicit approval workflow slice.'
  },
  {
    key: 'record-global-disable-state',
    label: 'Record global disable state',
    enabled: false,
    reason: 'Global disable state recording requires an explicit operational control slice.'
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
      'add owner-only API endpoints with CSRF and audit checks',
      'add scheduler and delivery execution in separate reviewed slices'
    ]
  };
}

export const buildScheduledReportManagementSurfaceContract = buildAdminAnalyticsScheduledReportManagementSurfaceContract;
