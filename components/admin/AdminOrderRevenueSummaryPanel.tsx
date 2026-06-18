import { AdminAnalyticsBarChart, AdminAnalyticsTrendChart } from '@/components/admin/AdminAnalyticsChartPrimitives';
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
    aov: 'AOV',
    businessCharts: 'Business analytics charts',
    businessChartsBody: 'Fast visual breakdowns for order state, revenue distribution, and 30-day trends, with accessible data tables included.',
    trendCharts: '30-day trend charts',
    trendChartsBody: 'Daily order, revenue, and average order value trends for the latest rolling 30-day window.',
    ordersOverTime: 'Orders over time',
    ordersOverTimeBody: 'Daily order count for the latest 30 days.',
    revenueOverTime: 'Revenue over time',
    revenueOverTimeBody: 'Eligible daily revenue for the latest 30 days, excluding cancelled/refunded/voided orders.',
    aovOverTime: 'Average order value over time',
    aovOverTimeBody: 'Daily average order value based on eligible revenue and order count.',
    statusBreakdown: 'Orders by status',
    statusBreakdownBody: 'Shows how the current order backlog is distributed across lifecycle states.',
    revenueByCurrency: 'Revenue by currency',
    revenueByCurrencyBody: 'Eligible revenue grouped by currency for the most recent order sample.',
    noChartData: 'No analytics data is available yet.',
    dataTable: 'View chart data',
    count: 'Count',
    amount: 'Amount'
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
    aov: 'میانگین سفارش',
    businessCharts: 'نمودارهای تحلیل کسب‌وکار',
    businessChartsBody: 'نمای سریع وضعیت سفارش، توزیع درآمد و روند ۳۰ روزه، همراه با جدول داده دسترس‌پذیر.',
    trendCharts: 'نمودار روند ۳۰ روزه',
    trendChartsBody: 'روند روزانه سفارش، درآمد و میانگین ارزش سفارش برای بازه ۳۰ روزه اخیر.',
    ordersOverTime: 'سفارش‌ها در طول زمان',
    ordersOverTimeBody: 'تعداد سفارش روزانه برای ۳۰ روز اخیر.',
    revenueOverTime: 'درآمد در طول زمان',
    revenueOverTimeBody: 'درآمد روزانه قابل محاسبه برای ۳۰ روز اخیر، بدون سفارش‌های لغوشده، بازپرداخت‌شده یا باطل‌شده.',
    aovOverTime: 'میانگین ارزش سفارش در طول زمان',
    aovOverTimeBody: 'میانگین روزانه ارزش سفارش بر اساس درآمد قابل محاسبه و تعداد سفارش.',
    statusBreakdown: 'سفارش‌ها بر اساس وضعیت',
    statusBreakdownBody: 'نشان می‌دهد بار سفارش فعلی بین وضعیت‌های چرخه سفارش چگونه توزیع شده است.',
    revenueByCurrency: 'درآمد بر اساس ارز',
    revenueByCurrencyBody: 'درآمد قابل محاسبه بر اساس ارز برای نمونه اخیر سفارش‌ها.',
    noChartData: 'هنوز داده تحلیلی موجود نیست.',
    dataTable: 'مشاهده جدول داده نمودار',
    count: 'تعداد',
    amount: 'مبلغ'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatStatusLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown';
}

function formatDateLabel(value: string, locale: SupportedLocale | string | null | undefined) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
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
  const dailyTrendRows = summary.recentDaily.map((point) => ({ ...point, label: formatDateLabel(point.date, locale) }));
  const orderTrendChartRows = dailyTrendRows.map((point) => ({
    label: point.label,
    value: point.orderCount,
    displayValue: String(point.orderCount)
  }));
  const revenueTrendChartRows = dailyTrendRows.map((point) => ({
    label: point.label,
    value: point.revenueCents,
    displayValue: formatRevenueCents(point.revenueCents, primaryCurrency)
  }));
  const averageOrderValueTrendRows = dailyTrendRows.map((point) => ({
    label: point.label,
    value: point.averageOrderValueCents,
    displayValue: formatRevenueCents(point.averageOrderValueCents, primaryCurrency)
  }));
  const statusChartRows = Object.entries(summary.byStatus)
    .map(([status, count]) => ({ label: formatStatusLabel(status), value: count, displayValue: String(count) }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  const currencyRevenueChartRows = summary.byCurrency.map((row) => ({
    label: row.currency,
    value: row.revenueCents,
    displayValue: formatRevenueCents(row.revenueCents, row.currency),
    detail: `${row.orderCount} ${labels.orders}`
  }));
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
      <section id="order-analytics" className="scroll-mt-24 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
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
        <div id="business-analytics-charts" className="mt-6 scroll-mt-24 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.businessCharts}</p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{labels.businessChartsBody}</p>
          </div>
          <div className="mt-4 rounded-lg border border-stone-200 bg-white/70 p-4">
            <p className="text-sm font-bold text-stone-950">{labels.trendCharts}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.trendChartsBody}</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <AdminAnalyticsTrendChart
                title={labels.ordersOverTime}
                description={labels.ordersOverTimeBody}
                rows={orderTrendChartRows}
                emptyLabel={labels.noChartData}
                valueLabel={labels.count}
              />
              <AdminAnalyticsTrendChart
                title={labels.revenueOverTime}
                description={labels.revenueOverTimeBody}
                rows={revenueTrendChartRows}
                emptyLabel={labels.noChartData}
                valueLabel={labels.amount}
              />
              <AdminAnalyticsTrendChart
                title={labels.aovOverTime}
                description={labels.aovOverTimeBody}
                rows={averageOrderValueTrendRows}
                emptyLabel={labels.noChartData}
                valueLabel={labels.amount}
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminAnalyticsBarChart
              title={labels.statusBreakdown}
              description={labels.statusBreakdownBody}
              rows={statusChartRows}
              emptyLabel={labels.noChartData}
              valueLabel={labels.count}
            />
            <AdminAnalyticsBarChart
              title={labels.revenueByCurrency}
              description={labels.revenueByCurrencyBody}
              rows={currencyRevenueChartRows}
              emptyLabel={labels.noChartData}
              valueLabel={labels.amount}
            />
          </div>
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