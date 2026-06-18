export type AnalyticsComparisonDirection = 'up' | 'down' | 'flat';

export type AnalyticsComparisonDelta = {
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentChange: number | null;
  direction: AnalyticsComparisonDirection;
};

function normalizeMetricValue(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value);
}

export function buildAnalyticsComparisonDelta(currentValue: number, previousValue: number): AnalyticsComparisonDelta {
  const current = normalizeMetricValue(currentValue);
  const previous = normalizeMetricValue(previousValue);
  const absoluteChange = current - previous;
  const direction: AnalyticsComparisonDirection = absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'flat';
  const percentChange = previous > 0 ? (absoluteChange / previous) * 100 : current === 0 ? 0 : null;

  return {
    currentValue: current,
    previousValue: previous,
    absoluteChange,
    percentChange,
    direction
  };
}
