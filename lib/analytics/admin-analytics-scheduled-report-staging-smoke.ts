import {
  buildScheduledReportRuntimeFlagMatrix,
  type ScheduledReportRuntimeFlagState
} from './admin-analytics-scheduled-report-runtime-flags';
import { buildScheduledReportSchedulerRegistrationPlan } from './admin-analytics-scheduled-report-scheduler-registration';
import {
  validateScheduledReportOwnerOutbox,
  type AdminAnalyticsScheduledReportOwnerOutboxOptions
} from './admin-analytics-scheduled-report-transport';

export type AdminAnalyticsScheduledReportStagingSmokeEvidence = {
  reportConfigExists: boolean;
  ownerApprovalExists: boolean;
  dryRunEvidenceExists: boolean;
  payloadMaterializes: boolean;
  manualOwnerRunGatesPass: boolean;
};

export type AdminAnalyticsScheduledReportStagingSmokeResult = {
  status: 'staging_smoke_blocked' | 'staging_smoke_ready';
  ownerOnly: true;
  liveDeliveryAttempted: false;
  automaticRunRegistered: false;
  runtimeStatus: 'fail_closed' | 'ready_for_staging';
  clockPlanStatus: 'registration_blocked' | 'registration_ready';
  outboxStatus: 'owner_outbox_valid' | 'owner_outbox_invalid';
  blockers: string[];
  checklist: Array<{
    key: keyof AdminAnalyticsScheduledReportStagingSmokeEvidence | 'runtimeFlags' | 'clockPlan' | 'ownerOutbox';
    ready: boolean;
    label: string;
  }>;
};

const DEFAULT_EVIDENCE: AdminAnalyticsScheduledReportStagingSmokeEvidence = {
  reportConfigExists: false,
  ownerApprovalExists: false,
  dryRunEvidenceExists: false,
  payloadMaterializes: false,
  manualOwnerRunGatesPass: false
};

const EVIDENCE_LABELS: Record<keyof AdminAnalyticsScheduledReportStagingSmokeEvidence, string> = {
  reportConfigExists: 'scheduled report configuration exists',
  ownerApprovalExists: 'owner approval evidence exists',
  dryRunEvidenceExists: 'dry-run evidence exists',
  payloadMaterializes: 'payload materialization succeeds',
  manualOwnerRunGatesPass: 'manual owner-run gates pass'
};

function evidenceBlockers(evidence: AdminAnalyticsScheduledReportStagingSmokeEvidence): string[] {
  return (Object.keys(evidence) as Array<keyof AdminAnalyticsScheduledReportStagingSmokeEvidence>)
    .filter((key) => !evidence[key])
    .map((key) => `${EVIDENCE_LABELS[key]} is required`);
}

export function buildScheduledReportStagingSmokeHarness(options: {
  evidence?: Partial<AdminAnalyticsScheduledReportStagingSmokeEvidence>;
  flags?: Partial<ScheduledReportRuntimeFlagState>;
  ownerOutbox?: AdminAnalyticsScheduledReportOwnerOutboxOptions;
} = {}): AdminAnalyticsScheduledReportStagingSmokeResult {
  const evidence = { ...DEFAULT_EVIDENCE, ...options.evidence };
  const runtime = buildScheduledReportRuntimeFlagMatrix({ flags: options.flags });
  const clockPlan = buildScheduledReportSchedulerRegistrationPlan({ flags: options.flags });
  const ownerOutbox = validateScheduledReportOwnerOutbox(
    options.ownerOutbox ?? {
      destinationKey: undefined,
      sourceLabel: undefined,
      credentialRef: undefined,
      runtimeEnabled: false
    }
  );

  const blockers = [
    ...evidenceBlockers(evidence),
    ...runtime.blockers,
    ...clockPlan.blockers.map((blocker) => `clock plan: ${blocker}`),
    ...ownerOutbox.blockers.map((blocker) => `owner outbox: ${blocker}`)
  ];

  const checklist: AdminAnalyticsScheduledReportStagingSmokeResult['checklist'] = [
    ...(Object.keys(evidence) as Array<keyof AdminAnalyticsScheduledReportStagingSmokeEvidence>).map((key) => ({
      key,
      ready: evidence[key],
      label: EVIDENCE_LABELS[key]
    })),
    { key: 'runtimeFlags', ready: runtime.status === 'ready_for_staging', label: 'runtime flag matrix is staging-ready' },
    { key: 'clockPlan', ready: clockPlan.status === 'registration_ready', label: 'clock plan reports readiness without registering' },
    { key: 'ownerOutbox', ready: ownerOutbox.status === 'owner_outbox_valid', label: 'owner outbox configuration validates' }
  ];

  return {
    status: blockers.length === 0 ? 'staging_smoke_ready' : 'staging_smoke_blocked',
    ownerOnly: true,
    liveDeliveryAttempted: false,
    automaticRunRegistered: false,
    runtimeStatus: runtime.status,
    clockPlanStatus: clockPlan.status,
    outboxStatus: ownerOutbox.status,
    blockers,
    checklist
  };
}
