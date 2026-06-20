export type AdminAnalyticsScheduledReportOwnerApprovalStatus = 'owner_approval_policy_contract_only';

export type AdminAnalyticsScheduledReportOwnerApprovalRequirement = {
  key: string;
  required: true;
  satisfiedByDefault: false;
  description: string;
};

export type AdminAnalyticsScheduledReportOwnerApprovalPolicy = {
  status: AdminAnalyticsScheduledReportOwnerApprovalStatus;
  enabled: false;
  ownerApprovalRecordingEnabled: false;
  ownerApprovalRequired: true;
  ownerApprovedByDefault: false;
  ownerRoleRequired: 'owner';
  scheduleActivationEnabled: false;
  deliveryExecutionEnabled: false;
  repositoryWritesEnabled: false;
  managementUiEnabled: false;
  readEndpointEnabled: false;
  globalDisableControlRequired: true;
  dryRunEvidenceRequired: true;
  aggregateOnlyPayloadRequired: true;
  selectedRangeRequired: true;
  deliveryDisabledUntilApproved: true;
  requiredEvidenceFields: string[];
  allowedReportTypes: ('business' | 'site')[];
  requirements: AdminAnalyticsScheduledReportOwnerApprovalRequirement[];
  blockedOperations: string[];
  activationBlockers: string[];
};

const REQUIRED_EVIDENCE_FIELDS = [
  'owner reviewer identity',
  'approval timestamp',
  'selected range query',
  'weekly or monthly cadence',
  'aggregate Business/Site report types',
  'Business CSV preview path',
  'Site CSV preview path',
  'dry-run summary',
  'global disable control confirmation',
  'delivery disabled confirmation'
];

const REQUIREMENTS: AdminAnalyticsScheduledReportOwnerApprovalRequirement[] = [
  {
    key: 'owner-role-confirmed',
    required: true,
    satisfiedByDefault: false,
    description: 'Only an owner may approve future scheduled report activation.'
  },
  {
    key: 'selected-range-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'The selected analytics range query must be recorded before activation.'
  },
  {
    key: 'aggregate-report-types-only',
    required: true,
    satisfiedByDefault: false,
    description: 'Future report payloads must remain aggregate Business/Site exports only.'
  },
  {
    key: 'dry-run-evidence-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'A dry run must capture the exact CSV paths and selected reporting window.'
  },
  {
    key: 'global-disable-control-validated',
    required: true,
    satisfiedByDefault: false,
    description: 'A global disable control must be validated before activation.'
  },
  {
    key: 'delivery-remains-disabled-before-approval',
    required: true,
    satisfiedByDefault: false,
    description: 'Delivery must remain disabled until a separate audited activation slice.'
  }
];

const BLOCKED_OPERATIONS = [
  'record owner approval',
  'activate scheduled report metadata',
  'enable scheduled report delivery',
  'write scheduled report metadata',
  'expose scheduled report management UI',
  'expose scheduled report activation route',
  'start scheduler or timer execution'
];

export function buildAdminAnalyticsScheduledReportOwnerApprovalPolicy(): AdminAnalyticsScheduledReportOwnerApprovalPolicy {
  return {
    status: 'owner_approval_policy_contract_only',
    enabled: false,
    ownerApprovalRecordingEnabled: false,
    ownerApprovalRequired: true,
    ownerApprovedByDefault: false,
    ownerRoleRequired: 'owner',
    scheduleActivationEnabled: false,
    deliveryExecutionEnabled: false,
    repositoryWritesEnabled: false,
    managementUiEnabled: false,
    readEndpointEnabled: false,
    globalDisableControlRequired: true,
    dryRunEvidenceRequired: true,
    aggregateOnlyPayloadRequired: true,
    selectedRangeRequired: true,
    deliveryDisabledUntilApproved: true,
    requiredEvidenceFields: [...REQUIRED_EVIDENCE_FIELDS],
    allowedReportTypes: ['business', 'site'],
    requirements: REQUIREMENTS.map((requirement) => ({ ...requirement })),
    blockedOperations: [...BLOCKED_OPERATIONS],
    activationBlockers: [
      'owner approval recording not enabled',
      'owner approval evidence not recorded',
      'dry-run evidence not recorded',
      'global disable control not validated',
      'repository writes remain disabled',
      'management UI not implemented',
      'schedule activation remains disabled',
      'delivery execution remains disabled'
    ]
  };
}
