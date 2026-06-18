export const ADMIN_ANALYTICS_RANGE_DAYS = [7, 30, 90] as const;
export const DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS = 30;

export type AdminAnalyticsRangeDays = typeof ADMIN_ANALYTICS_RANGE_DAYS[number];

const ADMIN_ANALYTICS_RANGE_DAY_SET = new Set<number>(ADMIN_ANALYTICS_RANGE_DAYS);
const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminAnalyticsRangeInput = string | string[] | number | null | undefined;

function firstRangeValue(value: AdminAnalyticsRangeInput) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeAdminAnalyticsRangeDays(value?: AdminAnalyticsRangeInput): AdminAnalyticsRangeDays {
  const scalar = firstRangeValue(value);
  const parsed = typeof scalar === 'number' ? scalar : Number.parseInt(String(scalar ?? ''), 10);
  return ADMIN_ANALYTICS_RANGE_DAY_SET.has(parsed) ? parsed as AdminAnalyticsRangeDays : DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS;
}

export function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function getAdminAnalyticsRangeStart(now: Date, value?: AdminAnalyticsRangeInput) {
  const rangeDays = normalizeAdminAnalyticsRangeDays(value);
  return new Date(startOfUtcDay(now).getTime() - (rangeDays - 1) * DAY_MS);
}

export function isWithinAdminAnalyticsRange(createdAt: Date, now: Date, value?: AdminAnalyticsRangeInput) {
  const day = startOfUtcDay(createdAt);
  return day >= getAdminAnalyticsRangeStart(now, value) && day <= startOfUtcDay(now);
}
