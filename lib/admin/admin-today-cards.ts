import type { CheckoutOrderSummary, Product } from '@/lib/catalog';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { RuntimeReadiness } from '@/lib/runtime-readiness';

export type AdminTodaySeverity = 'critical' | 'warning' | 'info' | 'success';

export type AdminTodayCard = {
  id: string;
  label: string;
  detail: string;
  count: number;
  href: string;
  cta: string;
  severity: AdminTodaySeverity;
};

export type AdminTodayInput = {
  products: Product[];
  orders: CheckoutOrderSummary[];
  orderTotalCount?: number;
  inquiryStatusCounts: { status: string; count: number }[];
  runtimeReadiness: Pick<RuntimeReadiness, 'databaseUrlPresent' | 'productionSafe'>;
  checkoutReadiness: Pick<PaymentGatewayReadiness, 'blockers' | 'warnings' | 'ready'>;
};

function statusCount(counts: { status: string; count: number }[], status: string) {
  return counts.find((item) => item.status === status)?.count ?? 0;
}

function hasImage(product: Product) {
  return Boolean(product.image?.trim());
}

function isQuoteOnly(product: Product) {
  return Boolean(product.requiresQuote || product.price <= 0);
}

function isLowOrOutOfStock(product: Product) {
  return (product.variants ?? []).some((variant) => {
    if (!variant.isActive || variant.trackInventory === false) return false;
    const threshold = variant.lowStockThreshold ?? 0;
    return variant.stockQuantity <= Math.max(0, threshold);
  });
}

function isOrderNeedingFulfillment(order: CheckoutOrderSummary) {
  const status = order.status?.toLowerCase();
  const fulfillment = order.fulfillmentStatus?.toLowerCase();
  if (status === 'cancelled' || status === 'canceled' || status === 'refunded') return false;
  return !fulfillment || !['fulfilled', 'delivered', 'complete', 'completed', 'cancelled', 'canceled'].includes(fulfillment);
}

function isPaymentAlert(order: CheckoutOrderSummary) {
  const paymentStatus = order.latestPaymentStatus?.toLowerCase();
  return Boolean(order.latestPaymentRequiresManualReview || paymentStatus === 'failed' || paymentStatus === 'requires_action' || paymentStatus === 'requires_payment_method');
}

function card(input: AdminTodayCard): AdminTodayCard | undefined {
  return input.count > 0 ? input : undefined;
}

function allClearCard(): AdminTodayCard {
  return {
    id: 'all-clear',
    label: 'Today is clear',
    detail: 'No urgent product, inquiry, order, payment, or readiness actions were found from the current admin data.',
    count: 0,
    href: '/admin',
    cta: 'Review overview',
    severity: 'success'
  };
}

export function buildAdminTodayCards(input: AdminTodayInput): AdminTodayCard[] {
  const newInquiries = statusCount(input.inquiryStatusCounts, 'new');
  const ordersNeedingFulfillment = input.orders.filter(isOrderNeedingFulfillment).length;
  const paymentAlerts = input.orders.filter(isPaymentAlert).length;
  const missingImages = input.products.filter((product) => !hasImage(product)).length;
  const inactiveProducts = input.products.filter((product) => product.isActive === false).length;
  const quoteOnlyProducts = input.products.filter(isQuoteOnly).length;
  const inventoryPressure = input.products.filter(isLowOrOutOfStock).length;
  const readinessBlockers = (input.runtimeReadiness.databaseUrlPresent ? 0 : 1) + (input.runtimeReadiness.productionSafe ? 0 : 1) + input.checkoutReadiness.blockers.length;
  const readinessWarnings = input.checkoutReadiness.warnings.length;

  const cards = [
    card({
      id: 'readiness-blockers',
      label: 'Readiness blockers',
      detail: 'Runtime or checkout settings need attention before operations are fully healthy.',
      count: readinessBlockers,
      href: '/admin/readiness',
      cta: 'Fix readiness',
      severity: 'critical'
    }),
    card({
      id: 'payment-alerts',
      label: 'Payment alerts',
      detail: 'Orders on the current page have failed payments or require manual review.',
      count: paymentAlerts,
      href: '/admin/payments/alerts',
      cta: 'Review payments',
      severity: 'critical'
    }),
    card({
      id: 'orders-needing-fulfillment',
      label: 'Orders need fulfillment',
      detail: `${ordersNeedingFulfillment} of ${input.orderTotalCount ?? input.orders.length} loaded orders still need an operations step.`,
      count: ordersNeedingFulfillment,
      href: '/admin/orders?orderFulfillmentStatus=pending',
      cta: 'Open orders',
      severity: 'warning'
    }),
    card({
      id: 'new-inquiries',
      label: 'New inquiries',
      detail: 'Customers are waiting for first response or assignment.',
      count: newInquiries,
      href: '/admin/inquiries?inquiryStatus=new',
      cta: 'Contact customers',
      severity: 'warning'
    }),
    card({
      id: 'missing-product-images',
      label: 'Products missing images',
      detail: 'Catalog items without imagery weaken storefront browsing and conversion.',
      count: missingImages,
      href: '/admin/products?catalogFlag=missing-image',
      cta: 'Review products',
      severity: 'warning'
    }),
    card({
      id: 'inventory-pressure',
      label: 'Inventory pressure',
      detail: 'Tracked variants are low or out of stock and may block same-day sales.',
      count: inventoryPressure,
      href: '/admin/products?catalogFlag=available-today',
      cta: 'Check stock',
      severity: 'warning'
    }),
    card({
      id: 'inactive-products',
      label: 'Inactive products',
      detail: 'Inactive catalog items may need cleanup, relaunch, or archival decisions.',
      count: inactiveProducts,
      href: '/admin/products?catalogFlag=inactive',
      cta: 'Review inactive',
      severity: 'info'
    }),
    card({
      id: 'quote-only-products',
      label: 'Quote-only products',
      detail: 'Products that require staff pricing should be reviewed for accuracy and follow-up expectations.',
      count: quoteOnlyProducts,
      href: '/admin/products?catalogFlag=quote-only',
      cta: 'Review quotes',
      severity: 'info'
    }),
    card({
      id: 'readiness-warnings',
      label: 'Readiness warnings',
      detail: 'Checkout is usable but has warnings that staff should understand.',
      count: readinessWarnings,
      href: '/admin/readiness',
      cta: 'Review warnings',
      severity: 'info'
    })
  ].filter((item): item is AdminTodayCard => Boolean(item));

  return cards.length > 0 ? cards : [allClearCard()];
}
