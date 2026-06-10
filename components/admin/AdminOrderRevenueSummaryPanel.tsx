import { AdminBestSellingProductsPanel } from '@/components/admin/AdminBestSellingProductsPanel';
import { AdminFailedPaymentNotificationAlertsPanel } from '@/components/admin/AdminFailedPaymentNotificationAlertsPanel';
import { AdminFulfillmentQueueSummaryPanel } from '@/components/admin/AdminFulfillmentQueueSummaryPanel';
import { AdminInquiryOperationsSummaryPanel } from '@/components/admin/AdminInquiryOperationsSummaryPanel';
import { AdminLaunchReadinessHealthPanel } from '@/components/admin/AdminLaunchReadinessHealthPanel';
import { AdminLowStockAlertsPanel } from '@/components/admin/AdminLowStockAlertsPanel';
import { AdminRecentActivitySummaryPanel } from '@/components/admin/AdminRecentActivitySummaryPanel';
import { bestSellingProductsService } from '@/lib/analytics/best-selling-products';
import { failedPaymentNotificationAlertsService } from '@/lib/analytics/failed-payment-notification-alerts';
import { fulfillmentQueueSummaryService } from '@/lib/analytics/fulfillment-queue-summary';
import { inquiryOperationsSummaryService } from '@/lib/analytics/inquiry-operations-summary';
import { launchReadinessHealthService } from '@/lib/analytics/launch-readiness-health';
import { lowStockAlertsService } from '@/lib/analytics/low-stock-alerts';
import { formatRevenueCents, type OrderRevenueSummary } from '@/lib/analytics/order-revenue-summary';
import { recentActivitySummaryService } from '@/lib/analytics/recent-activity-summary';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Order count and revenue',
    body: 'Daily operations snapshot for order volume, eligible revenue, recent activity, and open order load.',
    totalOrders: 'Total orders',
    revenue: 'Revenue',
    excludesCancelledRefunded: 'excludes cancelled/refunded',
    averageOrderValue: 'Average order value',
    openOrders: 'Open orders',
    recentOrders: 'Recent orders',
    recentRevenue: 'Recent revenue',
    last30Days: 'last 30 days',
    completed: 'Completed',
    cancelled: 'Cancelled',
    currency: 'Currency',
    orders: 'Orders',
    aov: 'AOV'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'تعداد سفارش و درآمد',
    body: 'نمای روزانه عملیات برای حجم سفارش، درآمد قابل محاسبه، فعالیت اخیر و بار سفارش‌های باز.',
    totalOrders: 'کل سفارش‌ها',
    revenue: 'درآمد',
    excludesCancelledRefunded: 'بدون سفارش‌های لغوشده یا بازپرداخت‌شده',
    averageOrderValue: 'میانگین ارزش سفارش',
    openOrders: 'سفارش‌های باز',
    recentOrders: 'سفارش‌های اخیر',
    recentRevenue: 'درآمد اخیر',
    last30Days: '۳۰ روز گذشته',
    completed: 'تکمیل‌شده',
    cancelled: 'لغوشده',
    currency: 'ارز',
    orders: 'سفارش‌ها',
    aov: 'میانگین سفارش'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export async function AdminOrderRevenueSummaryPanel({ summary }: { summary: OrderRevenueSummary }) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const primaryCurrency = summary.primaryCurrency;
  const [inquiryOperationsSummary, bestSellingProductsSummary, lowStockAlertsSummary, fulfillmentQueueSummary, recentActivitySummary, failedPaymentNotificationAlertsSummary, launchReadinessHealthSummary] = await Promise.all([
    inquiryOperationsSummaryService.summary(),
    bestSellingProductsService.summary(),
    lowStockAlertsService.summary(),
    fulfillmentQueueSummaryService.summary(),
    recentActivitySummaryService.summary(),
    failedPaymentNotificationAlertsService.summary(),
    Promise.resolve(launchReadinessHealthService.summary())
  ]);

  return (
    <>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
          </div>
          <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
            {primaryCurrency}
          </span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label={labels.totalOrders} value={summary.totalOrders} />
          <Metric label={labels.revenue} value={formatRevenueCents(summary.totalRevenueCents, primaryCurrency)} detail={labels.excludesCancelledRefunded} />
          <Metric label={labels.averageOrderValue} value={formatRevenueCents(summary.averageOrderValueCents, primaryCurrency)} />
          <Metric label={labels.openOrders} value={summary.openOrders} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Metric label={labels.recentOrders} value={summary.recentOrders} detail={labels.last30Days} />
          <Metric label={labels.recentRevenue} value={formatRevenueCents(summary.recentRevenueCents, primaryCurrency)} detail={labels.last30Days} />
          <Metric label={labels.completed} value={summary.completedOrders} />
          <Metric label={labels.cancelled} value={summary.cancelledOrders} />
        </div>
        {summary.byCurrency.length ? (
          <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">{labels.currency}</th>
                  <th className="px-3 py-2">{labels.orders}</th>
                  <th className="px-3 py-2">{labels.revenue}</th>
                  <th className="px-3 py-2">{labels.aov}</th>
                </tr>
              </thead>
              <tbody>
                {summary.byCurrency.map((row) => (
                  <tr key={row.currency} className="border-t border-stone-200">
                    <td className="px-3 py-2 font-semibold text-stone-950">{row.currency}</td>
                    <td className="px-3 py-2 text-stone-700">{row.orderCount}</td>
                    <td className="px-3 py-2 text-stone-700">{formatRevenueCents(row.revenueCents, row.currency)}</td>
                    <td className="px-3 py-2 text-stone-700">{formatRevenueCents(row.averageOrderValueCents, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <AdminInquiryOperationsSummaryPanel summary={inquiryOperationsSummary} locale={locale} />
      <AdminBestSellingProductsPanel summary={bestSellingProductsSummary} locale={locale} />
      <AdminLowStockAlertsPanel summary={lowStockAlertsSummary} locale={locale} />
      <AdminFulfillmentQueueSummaryPanel summary={fulfillmentQueueSummary} locale={locale} />
      <AdminRecentActivitySummaryPanel summary={recentActivitySummary} locale={locale} />
      <AdminFailedPaymentNotificationAlertsPanel summary={failedPaymentNotificationAlertsSummary} locale={locale} />
      <AdminLaunchReadinessHealthPanel summary={launchReadinessHealthSummary} locale={locale} />
    </>
  );
}
