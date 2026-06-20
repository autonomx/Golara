export type AdminAnalyticsScheduledReportDryRunEvidenceStatus = 'dry_run_evidence_contract_only';

export type AdminAnalyticsScheduledReportDryRunEvidenceRequirement = {
  key: string;
  required: true;
  satisfiedByDefault: false;
  description: string;
};

export type AdminAnalyticsScheduledReportDryRunEvidencePolicy = {
  status: AdminAnalyticsScheduledReportDryRunEvidenceStatus;
  enabled: false;
  contractAvailable: true;
  evidenceRecordingEnabled: false;
  evidenceRequired: true;
  dryRunPassedByDefault: false;
  selectedRangeRequired: true;
  aggregateOnlyPayloadRequired: true;
  businessCsvPreviewRequired: true;
  siteCsvPreviewRequired: true;
  globalDisableEvidenceRequired: true;
  ownerApprovalEvidenceRequired: true;
  deliveryDisabledEvidenceRequired: true;
  scheduleActivationEnabled: false;
  deliveryExecutionEnabled: false;
  repositoryReadsEnabled: false;
  repositoryWritesEnabled: false;
  readEndpointEnabled: false;
  managementUiEnabled: false;
  requiredEvidenceFields: string[];
  allowedReportTypes: ('business' | 'site')[];
  requirements: AdminAnalyticsScheduledReportDryRunEvidenceRequirement[];
  blockedOperations: string[];
  activationBlockers: string[];
};

const REQUIRED_EVIDENCE_FIELDS = [
  'dry-run evidence id',
  'dry-run timestamp',
  'selected range query',
  'range label',
  'weekly or monthly cadence',
  'aggregate Business/Site report types',
  'Business CSV preview path',
  'Site CSV preview path',
  'global disable control confirmation',
  'owner approval policy confirmation',
  'delivery disabled confirmation',
  'operator reviewer identity'
];

const REQUIREMENTS: AdminAnalyticsScheduledReportDryRunEvidenceRequirement[] = [
  {
    key: 'selected-range-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'The dry run must record the selected analytics range query and human-readable range label.'
  },
  {
    key: 'aggregate-report-types-only',
    required: true,
    satisfiedByDefault: false,
    description: 'The dry run must be limited to aggregate Business and Site report outputs.'
  },
  {
    key: 'csv-preview-paths-recorded',
    required: true,
    satisfiedByDefault: false,
    description: 'The dry run must record the aggregate Business and Site CSV preview paths.'
  },
  {
    key: 'global-disable-control-confirmed',
    required: true,
    satisfiedByDefault: false,
    description: 'The dry run must record that global disable controls remain available before activation.'
  },
  {
    key: 'owner-approval-policy-confirmed',
    required: true,
    satisfiedByDefault: false,
    description: 'The dry run must record that owner approval policy evidence is required before activation.'
  },
  {
    key: 'delivery-disabled-confirmed',
    required: true,
    satisfiedByDefault: false,
    description: 'The dry run must record that delivery execution remains disabled.'
  }
];

const BLOCKED_OPERATIONS = [
  'record dry-run evidence',
  'activate scheduled report metadata',
  'enable scheduled report delivery',
  'write scheduled report metadata',
  'expose scheduled report management UI',
  'expose scheduled report activation route',
  'start scheduler or timer execution'
];

export function buildAdminAnalyticsScheduledReportDryRunEvidencePolicy(): AdminAnalyticsScheduledReportDryRunEvidencePolicy {
  return {
    status: 'dry_run_evidence_contract_only',
    enabled: false,
    contractAvailable: true,
    evidenceRecordingEnabled: false,
    evidenceRequired: true,
    dryRunPassedByDefault: false,
    selectedRangeRequired: true,
    aggregateOnlyPayloadRequired: true,
    businessCsvPreviewRequired: true,
    siteCsvPreviewRequired: true,
    globalDisableEvidenceRequired: true,
    ownerApprovalEvidenceRequired: true,
    deliveryDisabledEvidenceRequired: true,
    scheduleActivationEnabled: false,
    deliveryExecutionEnabled: false,
    repositoryReadsEnabled: false,
    repositoryWritesEnabled: false,
    readEndpointEnabled: false,
    managementUiEnabled: false,
    requiredEvidenceFields: [...REQUIRED_EVIDENCE_FIELDS],
    allowedReportTypes: ['business', 'site'],
    requirements: REQUIREMENTS.map((requirement) => ({ ...requirement })),
    blockedOperations: [...BLOCKED_OPERATIONS],
    activationBlockers: [
      'dry-run evidence recording not enabled',
      'dry-run evidence not recorded',
      'selected range evidence not recorded',
      'aggregate CSV preview paths not recorded',
      'global disable control evidence not recorded',
      'owner approval evidence not recorded',
      'repository writes remain disabled',
      'management UI not implemented',
      'schedule activation remains disabled',
      'delivery execution remains disabled'
    ]
  };
}
