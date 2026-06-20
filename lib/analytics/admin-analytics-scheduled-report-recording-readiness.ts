export type AdminAnalyticsScheduledReportRecordingReadinessStatus = 'recording_readiness_contract_only';

export type AdminAnalyticsScheduledReportRecordingTarget =
  | 'dry-run-evidence'
  | 'owner-approval'
  | 'global-disable-state';

export type AdminAnalyticsScheduledReportRecordingField =
  | 'lastDryRunAt'
  | 'lastDryRunSummary'
  | 'ownerApproved'
  | 'isActive'
  | 'deliveryEnabled'
  | 'metadata';

export type AdminAnalyticsScheduledReportRecordingGate = {
  key: string;
  required: true;
  satisfiedByDefault: false;
  description: string;
};

export type AdminAnalyticsScheduledReportRecordingPlan = {
  target: AdminAnalyticsScheduledReportRecordingTarget;
  enabled: false;
  repositoryWriteEnabled: false;
  recordFields: AdminAnalyticsScheduledReportRecordingField[];
  requiredEvidenceFields: string[];
  requiredGates: AdminAnalyticsScheduledReportRecordingGate[];
  blockedOperations: string[];
};

export type AdminAnalyticsScheduledReportRecordingReadinessContract = {
  status: AdminAnalyticsScheduledReportRecordingReadinessStatus;
  enabled: false;
  contractAvailable: true;
  dryRunEvidenceRecordingReady: true;
  dryRunEvidenceRecordingEnabled: false;
  ownerApprovalRecordingReady: true;
  ownerApprovalRecordingEnabled: false;
  globalDisableStateRecordingReady: true;
  globalDisableStateRecordingEnabled: false;
  repositoryReadsEnabled: false;
  repositoryWritesEnabled: false;
  readEndpointEnabled: false;
  writeEndpointEnabled: false;
  managementUiEnabled: false;
  schedulerEnabled: false;
  timerEnabled: false;
  backgroundJobEnabled: false;
  deliveryExecutionEnabled: false;
  ownerOverrideEnabled: false;
  allowedRecordingTargets: AdminAnalyticsScheduledReportRecordingTarget[];
  recordingPlans: AdminAnalyticsScheduledReportRecordingPlan[];
  activationBlockers: string[];
};

const COMMON_REQUIRED_GATES: AdminAnalyticsScheduledReportRecordingGate[] = [
  {
    key: 'owner-role-confirmed',
    required: true,
    satisfiedByDefault: false,
    description: 'Only an owner-reviewed flow may record scheduled-report evidence or approval state.'
  },
  {
    key: 'global-disable-control-validated',
    required: true,
    satisfiedByDefault: false,
    description: 'The global disable control must be validated before any recording path can be enabled.'
  },
  {
    key: 'delivery-disabled-confirmed',
    required: true,
    satisfiedByDefault: false,
    description: 'Delivery execution must remain disabled while recording paths are introduced.'
  }
];

const DRY_RUN_RECORDING_PLAN: AdminAnalyticsScheduledReportRecordingPlan = {
  target: 'dry-run-evidence',
  enabled: false,
  repositoryWriteEnabled: false,
  recordFields: ['lastDryRunAt', 'lastDryRunSummary'],
  requiredEvidenceFields: [
    'dry-run evidence id',
    'dry-run timestamp',
    'selected range query',
    'range label',
    'Business CSV preview path',
    'Site CSV preview path',
    'delivery disabled confirmation',
    'operator reviewer identity'
  ],
  requiredGates: [
    ...COMMON_REQUIRED_GATES,
    {
      key: 'aggregate-csv-preview-recorded',
      required: true,
      satisfiedByDefault: false,
      description: 'Business and Site CSV preview paths must be available before dry-run evidence can be recorded.'
    }
  ],
  blockedOperations: [
    'persist dry-run evidence',
    'activate scheduled report metadata',
    'enable delivery from dry run',
    'start scheduler from dry run'
  ]
};

const OWNER_APPROVAL_RECORDING_PLAN: AdminAnalyticsScheduledReportRecordingPlan = {
  target: 'owner-approval',
  enabled: false,
  repositoryWriteEnabled: false,
  recordFields: ['ownerApproved', 'metadata'],
  requiredEvidenceFields: [
    'owner reviewer identity',
    'approval timestamp',
    'dry-run evidence reference',
    'selected range query',
    'aggregate Business/Site report types',
    'global disable control confirmation',
    'delivery disabled confirmation'
  ],
  requiredGates: [
    ...COMMON_REQUIRED_GATES,
    {
      key: 'dry-run-evidence-linked',
      required: true,
      satisfiedByDefault: false,
      description: 'Owner approval must link to recorded dry-run evidence before any future activation path.'
    }
  ],
  blockedOperations: [
    'persist owner approval',
    'activate scheduled report metadata',
    'enable delivery from approval',
    'start scheduler from approval'
  ]
};

const GLOBAL_DISABLE_RECORDING_PLAN: AdminAnalyticsScheduledReportRecordingPlan = {
  target: 'global-disable-state',
  enabled: false,
  repositoryWriteEnabled: false,
  recordFields: ['isActive', 'deliveryEnabled', 'metadata'],
  requiredEvidenceFields: [
    'global disable control owner',
    'global disable control location',
    'safe default state',
    'rollback procedure',
    'audit log destination',
    'delivery disabled confirmation'
  ],
  requiredGates: [
    ...COMMON_REQUIRED_GATES,
    {
      key: 'safe-default-state-confirmed',
      required: true,
      satisfiedByDefault: false,
      description: 'Scheduled reports must remain disabled by default when global state recording is introduced.'
    }
  ],
  blockedOperations: [
    'persist global disable state',
    'enable owner override state',
    'activate scheduled report metadata',
    'enable delivery from global state'
  ]
};

export function buildAdminAnalyticsScheduledReportRecordingReadinessContract(): AdminAnalyticsScheduledReportRecordingReadinessContract {
  return {
    status: 'recording_readiness_contract_only',
    enabled: false,
    contractAvailable: true,
    dryRunEvidenceRecordingReady: true,
    dryRunEvidenceRecordingEnabled: false,
    ownerApprovalRecordingReady: true,
    ownerApprovalRecordingEnabled: false,
    globalDisableStateRecordingReady: true,
    globalDisableStateRecordingEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readEndpointEnabled: false,
    writeEndpointEnabled: false,
    managementUiEnabled: false,
    schedulerEnabled: false,
    timerEnabled: false,
    backgroundJobEnabled: false,
    deliveryExecutionEnabled: false,
    ownerOverrideEnabled: false,
    allowedRecordingTargets: ['dry-run-evidence', 'owner-approval', 'global-disable-state'],
    recordingPlans: [
      {
        ...DRY_RUN_RECORDING_PLAN,
        recordFields: [...DRY_RUN_RECORDING_PLAN.recordFields],
        requiredEvidenceFields: [...DRY_RUN_RECORDING_PLAN.requiredEvidenceFields],
        requiredGates: DRY_RUN_RECORDING_PLAN.requiredGates.map((gate) => ({ ...gate })),
        blockedOperations: [...DRY_RUN_RECORDING_PLAN.blockedOperations]
      },
      {
        ...OWNER_APPROVAL_RECORDING_PLAN,
        recordFields: [...OWNER_APPROVAL_RECORDING_PLAN.recordFields],
        requiredEvidenceFields: [...OWNER_APPROVAL_RECORDING_PLAN.requiredEvidenceFields],
        requiredGates: OWNER_APPROVAL_RECORDING_PLAN.requiredGates.map((gate) => ({ ...gate })),
        blockedOperations: [...OWNER_APPROVAL_RECORDING_PLAN.blockedOperations]
      },
      {
        ...GLOBAL_DISABLE_RECORDING_PLAN,
        recordFields: [...GLOBAL_DISABLE_RECORDING_PLAN.recordFields],
        requiredEvidenceFields: [...GLOBAL_DISABLE_RECORDING_PLAN.requiredEvidenceFields],
        requiredGates: GLOBAL_DISABLE_RECORDING_PLAN.requiredGates.map((gate) => ({ ...gate })),
        blockedOperations: [...GLOBAL_DISABLE_RECORDING_PLAN.blockedOperations]
      }
    ],
    activationBlockers: [
      'dry-run evidence recording not enabled',
      'owner approval recording not enabled',
      'global disable state recording not enabled',
      'repository writes remain disabled',
      'write endpoint not configured',
      'management UI not implemented',
      'scheduler remains disabled',
      'delivery execution remains disabled'
    ]
  };
}
