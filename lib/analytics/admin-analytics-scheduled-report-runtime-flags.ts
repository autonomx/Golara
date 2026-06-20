export type ScheduledReportRuntimeFlagKey =
  | 'readPreview'
  | 'recordingWrites'
  | 'dryRunPreview'
  | 'payloadPreview'
  | 'workerEvaluation'
  | 'scheduleRuntime'
  | 'clockRegistration'
  | 'queuedRunRegistration'
  | 'transportConfigured'
  | 'manualRun'
  | 'sendExecution'
  | 'retryRun';

export type ScheduledReportRuntimeFlagDefinition = {
  key: ScheduledReportRuntimeFlagKey;
  label: string;
  defaultEnabled: false;
  stage: 'preview' | 'planning' | 'send' | 'retry';
  requires: ScheduledReportRuntimeFlagKey[];
};

export type ScheduledReportRuntimeFlagState = Record<ScheduledReportRuntimeFlagKey, boolean>;

export type ScheduledReportRuntimeFlagRow = ScheduledReportRuntimeFlagDefinition & {
  enabled: boolean;
  ready: boolean;
  blockers: string[];
};

export type ScheduledReportRuntimeFlagMatrix = {
  status: 'fail_closed' | 'ready_for_staging';
  ownerOnly: true;
  productionDefaultsLocked: boolean;
  scheduledRunEnabled: boolean;
  sendEnabled: boolean;
  unsafeCombinationDetected: boolean;
  rows: ScheduledReportRuntimeFlagRow[];
  blockers: string[];
};

export const SCHEDULED_REPORT_RUNTIME_FLAG_DEFINITIONS: ScheduledReportRuntimeFlagDefinition[] = [
  { key: 'readPreview', label: 'Owner read preview', defaultEnabled: false, stage: 'preview', requires: [] },
  { key: 'recordingWrites', label: 'Owner evidence recording writes', defaultEnabled: false, stage: 'preview', requires: ['readPreview'] },
  { key: 'dryRunPreview', label: 'Dry-run preview execution', defaultEnabled: false, stage: 'preview', requires: ['readPreview', 'recordingWrites'] },
  { key: 'payloadPreview', label: 'Payload preview', defaultEnabled: false, stage: 'preview', requires: ['dryRunPreview'] },
  { key: 'workerEvaluation', label: 'Worker due-row evaluation', defaultEnabled: false, stage: 'planning', requires: ['payloadPreview'] },
  { key: 'scheduleRuntime', label: 'Schedule runtime gate', defaultEnabled: false, stage: 'planning', requires: ['workerEvaluation'] },
  { key: 'clockRegistration', label: 'Clock registration', defaultEnabled: false, stage: 'planning', requires: ['scheduleRuntime'] },
  { key: 'queuedRunRegistration', label: 'Queued run registration', defaultEnabled: false, stage: 'planning', requires: ['scheduleRuntime', 'clockRegistration'] },
  { key: 'transportConfigured', label: 'Transport configuration validated', defaultEnabled: false, stage: 'send', requires: ['payloadPreview'] },
  { key: 'manualRun', label: 'Manual owner-triggered run', defaultEnabled: false, stage: 'send', requires: ['transportConfigured', 'payloadPreview'] },
  { key: 'sendExecution', label: 'Send execution gate', defaultEnabled: false, stage: 'send', requires: ['manualRun', 'transportConfigured'] },
  { key: 'retryRun', label: 'Retry run gate', defaultEnabled: false, stage: 'retry', requires: ['sendExecution'] }
];

const DEFAULT_STATE = SCHEDULED_REPORT_RUNTIME_FLAG_DEFINITIONS.reduce(
  (state, definition) => ({ ...state, [definition.key]: false }),
  {} as ScheduledReportRuntimeFlagState
);

function missingRequirements(definition: ScheduledReportRuntimeFlagDefinition, state: ScheduledReportRuntimeFlagState): string[] {
  if (!state[definition.key]) return [];
  return definition.requires
    .filter((requirement) => !state[requirement])
    .map((requirement) => `${definition.key} requires ${requirement}`);
}

function unsafeCombinationBlockers(state: ScheduledReportRuntimeFlagState): string[] {
  const blockers: string[] = [];
  if (state.clockRegistration && !state.scheduleRuntime) blockers.push('clock registration cannot run without the schedule runtime gate');
  if (state.queuedRunRegistration && (!state.scheduleRuntime || !state.clockRegistration)) {
    blockers.push('queued run registration requires the schedule runtime gate and clock registration');
  }
  if (state.sendExecution && (!state.manualRun || !state.transportConfigured || !state.payloadPreview)) {
    blockers.push('send execution requires manual run, configured transport, and payload preview');
  }
  if (state.manualRun && state.queuedRunRegistration) blockers.push('manual-send staging must not enable queued runs');
  if (state.retryRun && !state.sendExecution) blockers.push('retry run requires send execution');
  return blockers;
}

export function buildScheduledReportRuntimeFlagMatrix(options: {
  flags?: Partial<ScheduledReportRuntimeFlagState>;
} = {}): ScheduledReportRuntimeFlagMatrix {
  const state: ScheduledReportRuntimeFlagState = { ...DEFAULT_STATE, ...options.flags };
  const rows = SCHEDULED_REPORT_RUNTIME_FLAG_DEFINITIONS.map((definition) => {
    const blockers = missingRequirements(definition, state);
    return {
      ...definition,
      enabled: state[definition.key],
      ready: state[definition.key] && blockers.length === 0,
      blockers
    };
  });
  const blockers = [...rows.flatMap((row) => row.blockers), ...unsafeCombinationBlockers(state)];

  return {
    status: blockers.length === 0 && rows.some((row) => row.enabled) ? 'ready_for_staging' : 'fail_closed',
    ownerOnly: true,
    productionDefaultsLocked: Object.values(DEFAULT_STATE).every((enabled) => enabled === false),
    scheduledRunEnabled: state.clockRegistration && state.queuedRunRegistration,
    sendEnabled: state.sendExecution,
    unsafeCombinationDetected: blockers.length > 0,
    rows,
    blockers
  };
}
