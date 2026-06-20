import {
  type AdminAnalyticsScheduledReportTransportAdapter,
  type AdminAnalyticsScheduledReportTransportPayload,
  type AdminAnalyticsScheduledReportTransportResult,
  createDisabledScheduledReportTransportAdapter
} from './admin-analytics-scheduled-report-transport';

export type AdminAnalyticsScheduledReportDeliveryGateState = {
  ownerApproved: boolean;
  dryRunEvidenceRecorded: boolean;
  globalKillSwitchPermitsDelivery: boolean;
  activeSchedule: boolean;
  deliveryPayloadMaterialized: boolean;
  deliveryExecutionEnabled: boolean;
  deliveryTransportConfigured: boolean;
  retryExecutionEnabled: boolean;
};

export type AdminAnalyticsScheduledReportDeliveryAuditRecord = {
  event: 'delivery_blocked' | 'delivery_dispatched' | 'delivery_failed';
  reportId: string;
  occurredAt: string;
  blockers: string[];
  transportProvider: string;
  sent: boolean;
};

export type AdminAnalyticsScheduledReportDeliveryFailureRecord = {
  reportId: string;
  failedAt: string;
  reason: string;
  retryEligible: false;
};

export type AdminAnalyticsScheduledReportDeliveryExecutionResult = {
  status: 'blocked' | 'delivered' | 'failed';
  sent: boolean;
  auditRecord: AdminAnalyticsScheduledReportDeliveryAuditRecord;
  failureRecord: AdminAnalyticsScheduledReportDeliveryFailureRecord | null;
  transportResult: AdminAnalyticsScheduledReportTransportResult | null;
};

const DEFAULT_GATES: AdminAnalyticsScheduledReportDeliveryGateState = {
  ownerApproved: false,
  dryRunEvidenceRecorded: false,
  globalKillSwitchPermitsDelivery: false,
  activeSchedule: false,
  deliveryPayloadMaterialized: false,
  deliveryExecutionEnabled: false,
  deliveryTransportConfigured: false,
  retryExecutionEnabled: false
};

function deliveryBlockers(gates: AdminAnalyticsScheduledReportDeliveryGateState): string[] {
  const blockers: string[] = [];
  if (!gates.ownerApproved) blockers.push('owner approval evidence not recorded');
  if (!gates.dryRunEvidenceRecorded) blockers.push('dry-run evidence not recorded');
  if (!gates.globalKillSwitchPermitsDelivery) blockers.push('global delivery kill switch blocks execution');
  if (!gates.activeSchedule) blockers.push('scheduled report is not active');
  if (!gates.deliveryPayloadMaterialized) blockers.push('delivery payload has not been materialized');
  if (!gates.deliveryExecutionEnabled) blockers.push('delivery execution flag is disabled');
  if (!gates.deliveryTransportConfigured) blockers.push('delivery transport is not configured');
  if (gates.retryExecutionEnabled) blockers.push('retry execution must remain disabled in delivery execution slice');
  return blockers;
}

function buildAudit(options: {
  event: AdminAnalyticsScheduledReportDeliveryAuditRecord['event'];
  payload: AdminAnalyticsScheduledReportTransportPayload;
  occurredAt: string;
  blockers: string[];
  transportProvider: string;
  sent: boolean;
}): AdminAnalyticsScheduledReportDeliveryAuditRecord {
  return {
    event: options.event,
    reportId: options.payload.reportId,
    occurredAt: options.occurredAt,
    blockers: options.blockers,
    transportProvider: options.transportProvider,
    sent: options.sent
  };
}

function failureRecord(payload: AdminAnalyticsScheduledReportTransportPayload, failedAt: string, reason: string): AdminAnalyticsScheduledReportDeliveryFailureRecord {
  return {
    reportId: payload.reportId,
    failedAt,
    reason,
    retryEligible: false
  };
}

export async function executeScheduledReportDelivery(options: {
  payload: AdminAnalyticsScheduledReportTransportPayload;
  gates?: Partial<AdminAnalyticsScheduledReportDeliveryGateState>;
  adapter?: AdminAnalyticsScheduledReportTransportAdapter;
  now?: Date;
}): Promise<AdminAnalyticsScheduledReportDeliveryExecutionResult> {
  const gates = { ...DEFAULT_GATES, ...options.gates };
  const adapter = options.adapter ?? createDisabledScheduledReportTransportAdapter();
  const occurredAt = (options.now ?? new Date()).toISOString();
  const blockers = deliveryBlockers(gates);

  if (blockers.length > 0) {
    return {
      status: 'blocked',
      sent: false,
      auditRecord: buildAudit({
        event: 'delivery_blocked',
        payload: options.payload,
        occurredAt,
        blockers,
        transportProvider: adapter.name,
        sent: false
      }),
      failureRecord: null,
      transportResult: null
    };
  }

  const transportResult = await adapter.dispatch(options.payload);
  if (!transportResult.sent) {
    const reason = transportResult.blockers[0] ?? 'transport did not confirm delivery';
    return {
      status: 'failed',
      sent: false,
      auditRecord: buildAudit({
        event: 'delivery_failed',
        payload: options.payload,
        occurredAt,
        blockers: transportResult.blockers,
        transportProvider: adapter.name,
        sent: false
      }),
      failureRecord: failureRecord(options.payload, occurredAt, reason),
      transportResult
    };
  }

  return {
    status: 'delivered',
    sent: true,
    auditRecord: buildAudit({
      event: 'delivery_dispatched',
      payload: options.payload,
      occurredAt,
      blockers: [],
      transportProvider: adapter.name,
      sent: true
    }),
    failureRecord: null,
    transportResult
  };
}

export function buildDisabledScheduledReportDeliveryExecutionPreview(payload: AdminAnalyticsScheduledReportTransportPayload) {
  return executeScheduledReportDelivery({ payload });
}
