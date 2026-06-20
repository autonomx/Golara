export type AdminAnalyticsScheduledReportScheduleCadence = 'weekly' | 'monthly';

export type AdminAnalyticsScheduledReportSchedulePlanRow = {
  id: string;
  label: string;
  cadence: string;
  isActive: boolean;
  ownerApproved: boolean;
  deliveryEnabled: boolean;
  hasDryRunEvidence?: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  metadata?: unknown;
};

export type AdminAnalyticsScheduledReportSchedulePlanItem = {
  id: string;
  label: string;
  cadence: AdminAnalyticsScheduledReportScheduleCadence;
  active: boolean;
  ownerApproved: boolean;
  dryRunEvidenceRecorded: boolean;
  deliveryEnabled: false;
  nextRunAt: string | null;
  nextRunReason: string;
  blockers: string[];
};

export type AdminAnalyticsScheduledReportSchedulePlanPreview = {
  status: 'schedule_plan_disabled_preview';
  ownerOnly: true;
  visibleToOwner: boolean;
  schedulerRuntimeEnabled: false;
  timerRegistrationEnabled: false;
  backgroundJobRegistrationEnabled: false;
  deliveryExecutionEnabled: false;
  deterministicPlanningOnly: true;
  timezone: 'UTC';
  generatedAt: string;
  rowsPlanned: number;
  rowsDueNow: 0;
  items: AdminAnalyticsScheduledReportSchedulePlanItem[];
  blockers: string[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEK_INTERVAL_MS = 7 * MS_PER_DAY;

function isSupportedCadence(value: string): value is AdminAnalyticsScheduledReportScheduleCadence {
  return value === 'weekly' || value === 'monthly';
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readActivationTimestamp(metadata: unknown): Date | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const activation = (metadata as { activation?: unknown }).activation;
  if (!activation || typeof activation !== 'object' || Array.isArray(activation)) return null;
  const activatedAt = (activation as { activatedAt?: unknown }).activatedAt;
  return typeof activatedAt === 'string' ? toDate(activatedAt) : null;
}

function lastDayOfUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addUtcMonthsClamped(anchor: Date, monthsToAdd: number): Date {
  const target = new Date(Date.UTC(
    anchor.getUTCFullYear(),
    anchor.getUTCMonth() + monthsToAdd,
    1,
    anchor.getUTCHours(),
    anchor.getUTCMinutes(),
    anchor.getUTCSeconds(),
    anchor.getUTCMilliseconds()
  ));
  target.setUTCDate(Math.min(anchor.getUTCDate(), lastDayOfUtcMonth(target.getUTCFullYear(), target.getUTCMonth())));
  return target;
}

export function calculateNextScheduledReportRun(options: {
  cadence: AdminAnalyticsScheduledReportScheduleCadence;
  anchor: Date;
  now: Date;
}): Date {
  if (options.cadence === 'weekly') {
    if (options.anchor.getTime() > options.now.getTime()) return new Date(options.anchor);
    const intervalsElapsed = Math.floor((options.now.getTime() - options.anchor.getTime()) / WEEK_INTERVAL_MS) + 1;
    return new Date(options.anchor.getTime() + intervalsElapsed * WEEK_INTERVAL_MS);
  }

  let monthsToAdd = 0;
  let next = addUtcMonthsClamped(options.anchor, monthsToAdd);
  while (next.getTime() <= options.now.getTime()) {
    monthsToAdd += 1;
    next = addUtcMonthsClamped(options.anchor, monthsToAdd);
  }
  return next;
}

function planBlockers(isOwner: boolean, row: AdminAnalyticsScheduledReportSchedulePlanRow): string[] {
  const blockers: string[] = [];
  if (!isOwner) blockers.push('owner admin role required');
  if (!isSupportedCadence(row.cadence)) blockers.push('unsupported cadence');
  if (!row.isActive) blockers.push('scheduled report is not active');
  if (!row.ownerApproved) blockers.push('owner approval evidence not recorded');
  if (row.hasDryRunEvidence !== true) blockers.push('dry-run evidence not recorded');
  if (row.deliveryEnabled) blockers.push('delivery must remain disabled while planning');
  return blockers;
}

function planItem(
  row: AdminAnalyticsScheduledReportSchedulePlanRow,
  options: { isOwner: boolean; now: Date }
): AdminAnalyticsScheduledReportSchedulePlanItem | null {
  if (!isSupportedCadence(row.cadence)) return null;
  const blockers = planBlockers(options.isOwner, row);
  const anchor = readActivationTimestamp(row.metadata) ?? toDate(row.updatedAt) ?? toDate(row.createdAt) ?? options.now;
  const nextRunAt = blockers.length === 0
    ? calculateNextScheduledReportRun({ cadence: row.cadence, anchor, now: options.now }).toISOString()
    : null;

  return {
    id: row.id,
    label: row.label,
    cadence: row.cadence,
    active: row.isActive,
    ownerApproved: row.ownerApproved,
    dryRunEvidenceRecorded: row.hasDryRunEvidence === true,
    deliveryEnabled: false,
    nextRunAt,
    nextRunReason: nextRunAt === null ? 'locked until activation and evidence gates pass' : `next ${row.cadence} run after ${anchor.toISOString()}`,
    blockers
  };
}

export function buildScheduledReportSchedulePlanPreview(options: {
  isOwner: boolean;
  rows: AdminAnalyticsScheduledReportSchedulePlanRow[];
  now?: Date;
}): AdminAnalyticsScheduledReportSchedulePlanPreview {
  const now = options.now ?? new Date();
  const items = options.rows
    .map((row) => planItem(row, { isOwner: options.isOwner, now }))
    .filter((item): item is AdminAnalyticsScheduledReportSchedulePlanItem => item !== null);
  const blockers = [
    'scheduler runtime disabled by default',
    'timer registration disabled by default',
    'background job registration disabled by default',
    'delivery execution disabled by default'
  ];
  if (!options.isOwner) blockers.unshift('owner admin role required');

  return {
    status: 'schedule_plan_disabled_preview',
    ownerOnly: true,
    visibleToOwner: options.isOwner,
    schedulerRuntimeEnabled: false,
    timerRegistrationEnabled: false,
    backgroundJobRegistrationEnabled: false,
    deliveryExecutionEnabled: false,
    deterministicPlanningOnly: true,
    timezone: 'UTC',
    generatedAt: now.toISOString(),
    rowsPlanned: items.length,
    rowsDueNow: 0,
    items,
    blockers
  };
}
