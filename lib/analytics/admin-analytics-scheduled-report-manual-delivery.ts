import {
  executeScheduledReportDelivery,
  type AdminAnalyticsScheduledReportDeliveryExecutionResult,
  type AdminAnalyticsScheduledReportDeliveryGateState
} from './admin-analytics-scheduled-report-delivery-execution';
import {
  createDisabledScheduledReportTransportAdapter,
  createProviderScheduledReportTransportAdapter,
  type AdminAnalyticsScheduledReportProviderDispatch,
  type AdminAnalyticsScheduledReportProviderDispatchOptions,
  type AdminAnalyticsScheduledReportTransportAdapter,
  type AdminAnalyticsScheduledReportTransportPayload
} from './admin-analytics-scheduled-report-transport';

export type AdminAnalyticsScheduledReportManualDeliveryGateState = AdminAnalyticsScheduledReportDeliveryGateState & {
  ownerSession: boolean;
  manualRunEnabled: boolean;
  scheduleRuntimeEnabled: boolean;
  queuedRunRegistrationEnabled: boolean;
};

export type AdminAnalyticsScheduledReportManualDeliveryResult = AdminAnalyticsScheduledReportDeliveryExecutionResult & {
  mode: 'manual_owner_run';
  manualBlockers: string[];
};

const DEFAULT_MANUAL_GATES: AdminAnalyticsScheduledReportManualDeliveryGateState = {
  ownerSession: false,
  manualRunEnabled: false,
  scheduleRuntimeEnabled: false,
  queuedRunRegistrationEnabled: false,
  ownerApproved: false,
  dryRunEvidenceRecorded: false,
  globalKillSwitchPermitsDelivery: false,
  activeSchedule: false,
  deliveryPayloadMaterialized: false,
  deliveryExecutionEnabled: false,
  deliveryTransportConfigured: false,
  retryExecutionEnabled: false
};

function manualDeliveryBlockers(gates: AdminAnalyticsScheduledReportManualDeliveryGateState): string[] {
  const blockers: string[] = [];
  if (!gates.ownerSession) blockers.push('owner session is required');
  if (!gates.manualRunEnabled) blockers.push('manual run flag is disabled');
  if (gates.scheduleRuntimeEnabled) blockers.push('schedule runtime must remain disabled for manual delivery');
  if (gates.queuedRunRegistrationEnabled) blockers.push('queued run registration must remain disabled for manual delivery');
  return blockers;
}

function deliveryGatesFromManual(gates: AdminAnalyticsScheduledReportManualDeliveryGateState): AdminAnalyticsScheduledReportDeliveryGateState {
  return {
    ownerApproved: gates.ownerApproved,
    dryRunEvidenceRecorded: gates.dryRunEvidenceRecorded,
    globalKillSwitchPermitsDelivery: gates.globalKillSwitchPermitsDelivery,
    activeSchedule: gates.activeSchedule,
    deliveryPayloadMaterialized: gates.deliveryPayloadMaterialized,
    deliveryExecutionEnabled: gates.deliveryExecutionEnabled,
    deliveryTransportConfigured: gates.deliveryTransportConfigured,
    retryExecutionEnabled: gates.retryExecutionEnabled
  };
}

export async function executeScheduledReportManualDelivery(options: {
  payload: AdminAnalyticsScheduledReportTransportPayload;
  gates?: Partial<AdminAnalyticsScheduledReportManualDeliveryGateState>;
  adapter?: AdminAnalyticsScheduledReportTransportAdapter;
  now?: Date;
}): Promise<AdminAnalyticsScheduledReportManualDeliveryResult> {
  const gates = { ...DEFAULT_MANUAL_GATES, ...options.gates };
  const manualBlockers = manualDeliveryBlockers(gates);

  if (manualBlockers.length > 0) {
    const result = await executeScheduledReportDelivery({
      payload: options.payload,
      gates: {
        ...deliveryGatesFromManual(gates),
        deliveryExecutionEnabled: false
      },
      adapter: createDisabledScheduledReportTransportAdapter(),
      now: options.now
    });
    return {
      ...result,
      mode: 'manual_owner_run',
      manualBlockers: [...manualBlockers, ...result.auditRecord.blockers]
    };
  }

  const result = await executeScheduledReportDelivery({
    payload: options.payload,
    gates: deliveryGatesFromManual(gates),
    adapter: options.adapter ?? createDisabledScheduledReportTransportAdapter(),
    now: options.now
  });

  return {
    ...result,
    mode: 'manual_owner_run',
    manualBlockers: result.auditRecord.blockers
  };
}

export async function executeScheduledReportManualProviderDelivery(options: {
  payload: AdminAnalyticsScheduledReportTransportPayload;
  gates?: Partial<AdminAnalyticsScheduledReportManualDeliveryGateState>;
  providerOptions: AdminAnalyticsScheduledReportProviderDispatchOptions;
  providerDispatch?: AdminAnalyticsScheduledReportProviderDispatch | null;
  now?: Date;
}): Promise<AdminAnalyticsScheduledReportManualDeliveryResult> {
  const providerAdapter = createProviderScheduledReportTransportAdapter(options.providerOptions, options.providerDispatch);
  return executeScheduledReportManualDelivery({
    payload: options.payload,
    gates: {
      ...options.gates,
      deliveryTransportConfigured: options.gates?.deliveryTransportConfigured ?? providerAdapter.configured
    },
    adapter: providerAdapter,
    now: options.now
  });
}
