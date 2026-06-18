export const ADMIN_ANALYTICS_RANGE_DAYS = [7, 30, 90] as const;
export const DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS = 30;
export const MAX_ADMIN_ANALYTICS_CUSTOM_RANGE_DAYS = 90;

export type AdminAnalyticsRangeDays = typeof ADMIN_ANALYTICS_RANGE_DAYS[number];

const ADMIN_ANALYTICS_RANGE_DAY_SET = new Set<number>(ADMIN_ANALYTICS_RANGE_DAYS);
const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminAnalyticsRangeInput = string | string[] | number | null | undefined;

export type AdminAnalyticsRangeSelectionInput = {
  range?: AdminAnalyticsRangeInput;
  from?: AdminAnalyticsRangeInput;
  to?: AdminAnalyticsRangeInput;
};

export type AdminAnalyticsResolvedRange = {
  rangeDays: number;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  isCustom: boolean;
  from?: string;
  to?: string;
  queryString: string;
};

function firstRangeValue(value: AdminAnalyticsRangeInput) {
  return Array.isArray(value) ? value[0] : value;
}

function formatUtcDate(value: Date) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

function parseUtcDateInput(value: AdminAnalyticsRangeInput) {
  const scalar = firstRangeValue(value);
  if (typeof scalar !== 'string') return null;
  const trimmed = scalar.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : startOfUtcDay(parsed);
}

function rangeDaysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) / DAY_MS) + 1);
}

function buildResolvedRange(start: Date, end: Date, isCustom: boolean): AdminAnalyticsResolvedRange {
  const normalizedStart = startOfUtcDay(start);
  const normalizedEnd = startOfUtcDay(end);
  const rangeDays = rangeDaysBetween(normalizedStart, normalizedEnd);
  const previousEnd = new Date(normalizedStart.getTime() - DAY_MS);
  const previousStart = new Date(previousEnd.getTime() - (rangeDays - 1) * DAY_MS);
  const from = formatUtcDate(normalizedStart);
  const to = formatUtcDate(normalizedEnd);

  return {
    rangeDays,
    start: normalizedStart,
    end: normalizedEnd,
    previousStart,
    previousEnd,
    isCustom,
    from: isCustom ? from : undefined,
    to: isCustom ? to : undefined,
    queryString: isCustom ? `from=${from}&to=${to}` : `range=${rangeDays}`
  };
}

export function normalizeAdminAnalyticsRangeDays(value?: AdminAnalyticsRangeInput): AdminAnalyticsRangeDays {
  const scalar = firstRangeValue(value);
  const parsed = typeof scalar === 'number' ? scalar : Number.parseInt(String(scalar ?? ''), 10);
  return ADMIN_ANALYTICS_RANGE_DAY_SET.has(parsed) ? parsed as AdminAnalyticsRangeDays : DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS;
}

export function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function resolveAdminAnalyticsRangeSelection(input: AdminAnalyticsRangeSelectionInput = {}, now = new Date()): AdminAnalyticsResolvedRange {
  const today = startOfUtcDay(now);
  const requestedStart = parseUtcDateInput(input.from);
  const requestedEnd = parseUtcDateInput(input.to);

  if (requestedStart && requestedEnd && requestedStart <= requestedEnd) {
    const end = requestedEnd > today ? today : requestedEnd;
    const earliestStart = new Date(end.getTime() - (MAX_ADMIN_ANALYTICS_CUSTOM_RANGE_DAYS - 1) * DAY_MS);
    const start = requestedStart < earliestStart ? earliestStart : requestedStart;
    return buildResolvedRange(start, end, true);
  }

  const rangeDays = normalizeAdminAnalyticsRangeDays(input.range);
  const end = today;
  const start = new Date(end.getTime() - (rangeDays - 1) * DAY_MS);
  return buildResolvedRange(start, end, false);
}

export function getAdminAnalyticsRangeStart(now: Date, value?: AdminAnalyticsRangeInput) {
  return resolveAdminAnalyticsRangeSelection({ range: value }, now).start;
}

export function getAdminAnalyticsPreviousRangeStart(now: Date, value?: AdminAnalyticsRangeInput) {
  return resolveAdminAnalyticsRangeSelection({ range: value }, now).previousStart;
}

export function getAdminAnalyticsPreviousRangeEnd(now: Date, value?: AdminAnalyticsRangeInput) {
  return resolveAdminAnalyticsRangeSelection({ range: value }, now).previousEnd;
}

export function isWithinAdminAnalyticsRange(createdAt: Date, now: Date, value?: AdminAnalyticsRangeInput) {
  const day = startOfUtcDay(createdAt);
  const range = resolveAdminAnalyticsRangeSelection({ range: value }, now);
  return day >= range.start && day <= range.end;
}

export function isWithinAdminAnalyticsPreviousRange(createdAt: Date, now: Date, value?: AdminAnalyticsRangeInput) {
  const day = startOfUtcDay(createdAt);
  const range = resolveAdminAnalyticsRangeSelection({ range: value }, now);
  return day >= range.previousStart && day <= range.previousEnd;
}

export function isWithinAdminAnalyticsResolvedRange(createdAt: Date, range: AdminAnalyticsResolvedRange) {
  const day = startOfUtcDay(createdAt);
  return day >= range.start && day <= range.end;
}

export function isWithinAdminAnalyticsResolvedPreviousRange(createdAt: Date, range: AdminAnalyticsResolvedRange) {
  const day = startOfUtcDay(createdAt);
  return day >= range.previousStart && day <= range.previousEnd;
}
