export type AdminAnalyticsScheduledReportGlobalKillSwitchStatus = 'global_kill_switch_contract_only';

export type AdminAnalyticsScheduledReportGlobalKillSwitchRequirement = {
  key: string;
  required: true;
  satisfiedByDefault: false;
  description: string;
};

export type AdminAnalyticsScheduledReportGlobalKillSwitchPolicy = {
  status: AdminAnalyticsScheduledReportGlobalKillSwitchStatus;
  enabled: false;
  contractAvailable: true;
  runtimeStateRecordingEnabled: false;
  globalDisableControlRequired: true;
  globalDisableControlValidatedByDefault: false;
  scheduledReportsDisabledByDefault: true;
  ownerOverrideEnabled: false;
  scheduleActivationEnabled: false;
  deliveryExecutionEnabled: false;
  repositoryReadsEnabled: false;
  repositoryWritesEnabled: false;
  readEndpointEnabled: false;
  managementUiEnabled: false;
  safeDefaultState: 'disabled';
  allowedFutureStates: ('disabled' | 'enabled')[];
  requiredEvidenceFields: string[];
  requirements: AdminAnalyticsScheduledReportGlobalKillSwitchRequirement[];
  blockedOperations: string[];
  activationBlockers: string[];
};

const REQUIRED_EVIDENCE_FIELDS = [
  'global disable control owner',
  'global disable control location',
  'global disable default state',
  'owner override policy',
  'dry-run evidence link',
  'delivery disabled confirmation',
  'rollback procedure',
  'audit log destination'
];

const REQUIREMENTS: AdminAnalyticsScheduledReportGlobalKillSwitchRequirement[] = [
  {
    key: 'disable-control-owner-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'The owner responsible for the global scheduled-report disable control must be recorded before activation.'
  },
  {
    key: 'disable-control-location-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'The future control location must be documented for operators before activation.'
  },
  {
    key: 'safe-default-state-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'Scheduled reports must default to a globally disabled state until explicitly activated in a later audited slice.'
  },
  {
    key: 'owner-override-policy-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'Any future owner override policy must be documented before activation.'
  },
  {
    key: 'dry-run-evidence-linked',
    required: true,
    satisfiedByDefault: false,
    description: 'Dry-run evidence must be linked before enabling active schedules or delivery.'
  },
  {
    key: 'rollback-procedure-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'A rollback procedure must be recorded before any runtime scheduled-report path is enabled.'
  }
];

const BLOCKED_OPERATIONS = [
  'record global disable state',
  'enable owner override state',
  'activate scheduled report metadata',
  'enable scheduled report delivery',
  'write scheduled report metadata',
  'expose scheduled report management UI',
  'expose scheduled report activation route',
  'start scheduler or timer execution'
];

export function buildAdminAnalyticsScheduledReportGlobalKillSwitchPolicy(): AdminAnalyticsScheduledReportGlobalKillSwitchPolicy {
  return {
    status: 'global_kill_switch_contract_only',
    enabled: false,
    contractAvailable: true,
    runtimeStateRecordingEnabled: false,
    globalDisableControlRequired: true,
    globalDisableControlValidatedByDefault: false,
    scheduledReportsDisabledByDefault: true,
    ownerOverrideEnabled: false,
    scheduleActivationEnabled: false,
    deliveryExecutionEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    safeDefaultState: 'disabled',
    allowedFutureStates: ['disabled', 'enabled'],
    requiredEvidenceFields: [...REQUIRED_EVIDENCE_FIELDS],
    requirements: REQUIREMENTS.map((requirement) => ({ ...requirement })),
    blockedOperations: [...BLOCKED_OPERATIONS],
    activationBlockers: [
      'global disable state recording not enabled',
      'global disable control evidence not recorded',
      'owner override policy not recorded',
      'dry-run evidence not linked',
      'repository writes remain disabled',
      'management UI not implemented',
      'schedule activation remains disabled',
      'delivery execution remains disabled'
    ]
  };
}
