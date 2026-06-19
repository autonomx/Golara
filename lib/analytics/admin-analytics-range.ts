export const ADMIN_ANALYTICS_RANGE_DAYS = [7, 30, 90, 365] as const;
export const DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS = 30;
export const MAX_ADMIN_ANALYTICS_CUSTOM_RANGE_DAYS = 365;

export type AdminAnalyticsRangeDays = typeof ADMIN_ANALYTICS_RANGE_DAYS[number];
export type AdminAnalyticsRangeMode = 'preset' | 'custom';

const ADMIN_ANALYTICS_RANGE_DAY_SET = new Set<number>(ADMIN_ANALYTICS_RANGE_DAYS);
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type AdminAnalyticsRangeInput = string | string[] | number | null | undefined;

export type AdminAnalyticsRangeQueryInput = {
  range?: AdminAnalyticsRangeInput;
  start?: AdminAnalyticsRangeInput;
  end?: AdminAnalyticsRangeInput;
};

export type AdminAnalyticsResolvedRange = {
  mode: AdminAnalyticsRangeMode;
  rangeDays: number;
  startDate: Date;
  endDate: Date;
  query: Record<string, string>;
  label: string;
  previousStartDate: Date;
  previousEndDate: Date;
};

export type AdminAnalyticsRangeSelection = AdminAnalyticsRangeInput | AdminAnalyticsRangeQueryInput | AdminAnalyticsResolvedRange;

function firstRangeValue(value: AdminAnalyticsRangeInput) {
  return Array.isArray(value) ? value[0] : value;
}

function dateKey(value: Date) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

function isRangeQueryInput(value: AdminAnalyticsRangeSelection): value is AdminAnalyticsRangeQueryInput {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && ('range' in value || 'start' in value || 'end' in value)
    && !('startDate' in value);
}

export function isAdminAnalyticsResolvedRange(value: unknown): value is AdminAnalyticsResolvedRange {
  return typeof value === 'object'
    && value !== null
    && 'mode' in value
    && 'rangeDays' in value
    && 'startDate' in value
    && 'endDate' in value
    && 'previousStartDate' in value
    && 'previousEndDate' in value;
}

export function normalizeAdminAnalyticsRangeDays(value?: AdminAnalyticsRangeInput): AdminAnalyticsRangeDays {
  const scalar = firstRangeValue(value);
  const parsed = typeof scalar === 'number' ? scalar : Number.parseInt(String(scalar ?? ''), 10);
  return ADMIN_ANALYTICS_RANGE_DAY_SET.has(parsed) ? parsed as AdminAnalyticsRangeDays : DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS;
}

export function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function parseIsoDate(value?: AdminAnalyticsRangeInput) {
  const scalar = firstRangeValue(value);
  if (typeof scalar !== 'string' || !ISO_DATE_RE.test(scalar)) return null;
  const [year, month, day] = scalar.split('-').map((part) => Number.parseInt(part, 10));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return dateKey(parsed) === scalar ? parsed : null;
}

function buildPresetRange(now: Date, value?: AdminAnalyticsRangeInput): AdminAnalyticsResolvedRange {
  const rangeDays = normalizeAdminAnalyticsRangeDays(value);
  const endDate = startOfUtcDay(now);
  const startDate = new Date(endDate.getTime() - (rangeDays - 1) * DAY_MS);
  const previousEndDate = new Date(startDate.getTime() - DAY_MS);
  const previousStartDate = new Date(previousEndDate.getTime() - (rangeDays - 1) * DAY_MS);
  return {
    mode: 'preset',
    rangeDays,
    startDate,
    endDate,
    query: { range: String(rangeDays) },
    label: `Last ${rangeDays} days`,
    previousStartDate,
    previousEndDate
  };
}

function buildCustomRange(now: Date, query: AdminAnalyticsRangeQueryInput): AdminAnalyticsResolvedRange | null {
  const startDate = parseIsoDate(query.start);
  const requestedEndDate = parseIsoDate(query.end);
  if (!startDate || !requestedEndDate) return null;

  const today = startOfUtcDay(now);
  const endDate = requestedEndDate > today ? today : requestedEndDate;
  if (startDate > endDate) return null;

  const rangeDays = Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
  if (rangeDays < 1 || rangeDays > MAX_ADMIN_ANALYTICS_CUSTOM_RANGE_DAYS) return null;

  const previousEndDate = new Date(startDate.getTime() - DAY_MS);
  const previousStartDate = new Date(previousEndDate.getTime() - (rangeDays - 1) * DAY_MS);
  const start = dateKey(startDate);
  const end = dateKey(endDate);

  return {
    mode: 'custom',
    rangeDays,
    startDate,
    endDate,
    query: { start, end },
    label: `${start} to ${end}`,
    previousStartDate,
    previousEndDate
  };
}

export function resolveAdminAnalyticsRange(now: Date, input?: AdminAnalyticsRangeSelection): AdminAnalyticsResolvedRange {
  if (isAdminAnalyticsResolvedRange(input)) return input;
  const query = isRangeQueryInput(input) ? input : { range: input as AdminAnalyticsRangeInput };
  return buildCustomRange(now, query) ?? buildPresetRange(now, query.range);
}

export function adminAnalyticsRangeQueryString(range: AdminAnalyticsResolvedRange, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ ...range.query, ...extra });
  return params.toString();
}

export function getAdminAnalyticsRangeStart(now: Date, value?: AdminAnalyticsRangeSelection) {
  return resolveAdminAnalyticsRange(now, value).startDate;
}

export function getAdminAnalyticsRangeEnd(now: Date, value?: AdminAnalyticsRangeSelection) {
  return resolveAdminAnalyticsRange(now, value).endDate;
}

export function getAdminAnalyticsPreviousRangeStart(now: Date, value?: AdminAnalyticsRangeSelection) {
  return resolveAdminAnalyticsRange(now, value).previousStartDate;
}

export function getAdminAnalyticsPreviousRangeEnd(now: Date, value?: AdminAnalyticsRangeSelection) {
  return resolveAdminAnalyticsRange(now, value).previousEndDate;
}

export function isWithinAdminAnalyticsRange(createdAt: Date, now: Date, value?: AdminAnalyticsRangeSelection) {
  const range = resolveAdminAnalyticsRange(now, value);
  const day = startOfUtcDay(createdAt);
  return day >= range.startDate && day <= range.endDate;
}

export function isWithinAdminAnalyticsPreviousRange(createdAt: Date, now: Date, value?: AdminAnalyticsRangeSelection) {
  const range = resolveAdminAnalyticsRange(now, value);
  const day = startOfUtcDay(createdAt);
  return day >= range.previousStartDate && day <= range.previousEndDate;
}
