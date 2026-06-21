export type AdminAnalyticsCustomerSegmentationSourceOrder = {
  id: string;
  customerId?: string | null;
  status: string;
  totalCents: number;
  createdAt: Date;
};

export type AdminAnalyticsCustomerSegmentKey =
  | 'new_known_customers'
  | 'active_repeat_customers'
  | 'high_value_customers'
  | 'lapsed_known_customers'
  | 'other_known_customers'
  | 'guest_orders';

export type AdminAnalyticsCustomerSegmentRow = {
  key: AdminAnalyticsCustomerSegmentKey;
  label: string;
  customerCount: number;
  orderCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
  revenueSharePercent: number;
  privacySuppressed: boolean;
};

export type AdminAnalyticsCustomerSegmentationSummary = {
  status: 'aggregate_segments_ready';
  aggregateOnly: true;
  rawIdentifiersIncluded: false;
  minimumSegmentCustomerCount: number;
  generatedAt: string;
  totalKnownCustomerCount: number;
  totalGuestOrderCount: number;
  totalRevenueCents: number;
  segments: AdminAnalyticsCustomerSegmentRow[];
};

type CustomerAggregate = {
  orderCount: number;
  revenueCents: number;
  latestOrderAt: Date;
};

const SEGMENT_LABELS: Record<AdminAnalyticsCustomerSegmentKey, string> = {
  new_known_customers: 'New known customers',
  active_repeat_customers: 'Active repeat customers',
  high_value_customers: 'High-value customers',
  lapsed_known_customers: 'Lapsed known customers',
  other_known_customers: 'Other known customers',
  guest_orders: 'Guest orders'
};

const REVENUE_EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'voided']);
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeStatus(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown';
}

function normalizeRevenueCents(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function revenueForOrder(order: AdminAnalyticsCustomerSegmentationSourceOrder) {
  return REVENUE_EXCLUDED_STATUSES.has(normalizeStatus(order.status)) ? 0 : normalizeRevenueCents(order.totalCents);
}

function averageOrderValue(revenueCents: number, orderCount: number) {
  return orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;
}

function revenueShare(revenueCents: number, totalRevenueCents: number) {
  return totalRevenueCents > 0 ? Math.round((revenueCents / totalRevenueCents) * 1000) / 10 : 0;
}

function createEmptySegment(key: AdminAnalyticsCustomerSegmentKey): AdminAnalyticsCustomerSegmentRow {
  return {
    key,
    label: SEGMENT_LABELS[key],
    customerCount: 0,
    orderCount: 0,
    revenueCents: 0,
    averageOrderValueCents: 0,
    revenueSharePercent: 0,
    privacySuppressed: false
  };
}

function segmentForCustomer(aggregate: CustomerAggregate, now: Date, highValueRevenueCents: number): AdminAnalyticsCustomerSegmentKey {
  const daysSinceLatestOrder = Math.max(0, Math.floor((now.getTime() - aggregate.latestOrderAt.getTime()) / DAY_MS));
  if (aggregate.orderCount >= 2 && aggregate.revenueCents >= highValueRevenueCents) return 'high_value_customers';
  if (aggregate.orderCount >= 2 && daysSinceLatestOrder <= 90) return 'active_repeat_customers';
  if (aggregate.orderCount === 1 && daysSinceLatestOrder <= 30) return 'new_known_customers';
  if (daysSinceLatestOrder > 90) return 'lapsed_known_customers';
  return 'other_known_customers';
}

export function buildAggregateCustomerSegmentationSummary(options: {
  orders: AdminAnalyticsCustomerSegmentationSourceOrder[];
  now?: Date;
  minimumSegmentCustomerCount?: number;
  highValueRevenueCents?: number;
}): AdminAnalyticsCustomerSegmentationSummary {
  const now = options.now ?? new Date();
  const minimumSegmentCustomerCount = Math.max(1, Math.trunc(options.minimumSegmentCustomerCount ?? 5));
  const highValueRevenueCents = Math.max(1, Math.trunc(options.highValueRevenueCents ?? 50000));
  const knownCustomers = new Map<string, CustomerAggregate>();
  const segments = new Map<AdminAnalyticsCustomerSegmentKey, AdminAnalyticsCustomerSegmentRow>([
    ['new_known_customers', createEmptySegment('new_known_customers')],
    ['active_repeat_customers', createEmptySegment('active_repeat_customers')],
    ['high_value_customers', createEmptySegment('high_value_customers')],
    ['lapsed_known_customers', createEmptySegment('lapsed_known_customers')],
    ['other_known_customers', createEmptySegment('other_known_customers')],
    ['guest_orders', createEmptySegment('guest_orders')]
  ]);

  for (const order of options.orders) {
    const revenueCents = revenueForOrder(order);
    const customerKey = order.customerId?.trim();
    if (!customerKey) {
      const guestSegment = segments.get('guest_orders');
      if (guestSegment) {
        guestSegment.orderCount += 1;
        guestSegment.revenueCents += revenueCents;
      }
      continue;
    }

    const aggregate = knownCustomers.get(customerKey) ?? {
      orderCount: 0,
      revenueCents: 0,
      latestOrderAt: order.createdAt
    };
    aggregate.orderCount += 1;
    aggregate.revenueCents += revenueCents;
    if (order.createdAt > aggregate.latestOrderAt) aggregate.latestOrderAt = order.createdAt;
    knownCustomers.set(customerKey, aggregate);
  }

  for (const aggregate of knownCustomers.values()) {
    const segmentKey = segmentForCustomer(aggregate, now, highValueRevenueCents);
    const segment = segments.get(segmentKey);
    if (!segment) continue;
    segment.customerCount += 1;
    segment.orderCount += aggregate.orderCount;
    segment.revenueCents += aggregate.revenueCents;
  }

  const totalRevenueCents = Array.from(segments.values()).reduce((sum, segment) => sum + segment.revenueCents, 0);
  const finalizedSegments = Array.from(segments.values()).map((segment): AdminAnalyticsCustomerSegmentRow => {
    const privacySuppressed = segment.key !== 'guest_orders' && segment.customerCount > 0 && segment.customerCount < minimumSegmentCustomerCount;
    return {
      ...segment,
      averageOrderValueCents: averageOrderValue(segment.revenueCents, segment.orderCount),
      revenueSharePercent: revenueShare(segment.revenueCents, totalRevenueCents),
      privacySuppressed
    };
  });

  return {
    status: 'aggregate_segments_ready',
    aggregateOnly: true,
    rawIdentifiersIncluded: false,
    minimumSegmentCustomerCount,
    generatedAt: now.toISOString(),
    totalKnownCustomerCount: knownCustomers.size,
    totalGuestOrderCount: segments.get('guest_orders')?.orderCount ?? 0,
    totalRevenueCents,
    segments: finalizedSegments
  };
}
