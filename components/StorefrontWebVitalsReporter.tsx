'use client';

import { useReportWebVitals } from 'next/web-vitals';

type StorefrontWebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: PerformanceEntry[];
  navigationType?: string;
};

const RUM_ENDPOINT = '/api/rum/web-vitals';
const WEB_VITAL_NAMES = new Set(['CLS', 'FID', 'FCP', 'INP', 'LCP', 'TTFB']);

function shouldReportWebVitals() {
  if (process.env.NEXT_PUBLIC_STOREFRONT_RUM_ENABLED === 'false') {
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
    return false;
  }

  return true;
}

function buildMetricPayload(metric: StorefrontWebVitalMetric) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
  const locale = typeof document === 'undefined' ? undefined : document.documentElement.lang;

  return {
    id: metric.id,
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,
    delta: typeof metric.delta === 'number' ? Math.round(metric.delta) : undefined,
    navigationType: metric.navigationType,
    pathname,
    locale,
    timestamp: Date.now(),
  };
}

function sendMetric(metric: StorefrontWebVitalMetric) {
  if (!shouldReportWebVitals() || !WEB_VITAL_NAMES.has(metric.name)) {
    return;
  }

  const payload = JSON.stringify(buildMetricPayload(metric));

  if (navigator.sendBeacon) {
    navigator.sendBeacon(RUM_ENDPOINT, new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch(RUM_ENDPOINT, {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => undefined);
}

export function StorefrontWebVitalsReporter() {
  useReportWebVitals(sendMetric);

  return null;
}
