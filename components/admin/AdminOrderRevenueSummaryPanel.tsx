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
    recentOrders: 'Range orders',
    recentRevenue: 'Range revenue',
    completed: 'Completed',
    cancelled: 'Cancelled',
    currency: 'Currency',
    orders: 'Orders',
    aov: 'AOV',
    businessCharts: 'Business analytics charts',
    businessChartsBody: 'Fast visual breakdowns for order state, revenue distribution, operational flow, payment method mix, discount usage, and selected-range trends, with accessible data tables included.',
    trendCharts: 'Trend charts',
    trendChartsBody: 'Daily order, revenue, and average order value trends for the selected analytics range.',
    operationalCharts: 'Operational breakdown charts',
    operationalChartsBody: 'Highlights where orders sit operationally, which payment methods are being used, and whether discounts are materially affecting the selected order sample.',
    ordersOverTime: 'Orders over time',
    ordersOverTimeBody: 'Daily order count for the selected analytics range.',
    revenueOverTime: 'Revenue over time',
    revenueOverTimeBody: 'Eligible daily revenue for the selected range, excluding cancelled/refunded/voided orders.',
    aovOverTime: 'Average order value over time',
    aovOverTimeBody: 'Daily average order value based on eligible revenue and order count for the selected range.',
    statusBreakdown: 'Orders by status',
    statusBreakdownBody: 'Shows how the selected order sample is distributed across lifecycle states.',
    revenueByCurrency: 'Revenue by currency',
    revenueByCurrencyBody: 'Eligible revenue grouped by currency for the selected order sample.',
    fulfillmentByStatus: 'Fulfillment by status',
    fulfillmentByStatusBody: 'Shows where selected-range orders are sitting in the fulfillment workflow.',
    paymentProviderMix: 'Payment method mix',
    paymentProviderMixBody: 'Counts payment attempts by provider/method so staff can see how customers are paying.',
    discountImpact: 'Discount usage impact',
    discountImpactBody: 'Compares discounted and non-discounted orders and surfaces total discount value.',
    discountedOrders: 'Discounted orders',
    undiscountedOrders: 'Orders without discount',
    totalDiscount: 'Total discount',
    noChartData: 'No analytics data is available yet.',
    dataTable: 'View chart data',
    count: 'Count',
    amount: 'Amount',
    attempts: 'Attempts'
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
    recentOrders: 'سفارش‌های بازه',
    recentRevenue: 'درآمد بازه',
    completed: 'تکمیل‌شده',
    cancelled: 'لغوشده',
    currency: 'ارز',
    orders: 'سفارش‌ها',
    aov: 'میانگین سفارش',
    businessCharts: 'نمودارهای تحلیل کسب‌وکار',
    businessChartsBody: 'نمای سریع وضعیت سفارش، توزیع درآمد، جریان عملیات، ترکیب روش پرداخت، مصرف تخفیف و روند بازه انتخاب‌شده، همراه با جدول داده دسترس‌پذیر.',
    trendCharts: 'نمودار روند',
    trendChartsBody: 'روند روزانه سفارش، درآمد و میانگین ارزش سفارش برای بازه انتخاب‌شده.',
    operationalCharts: 'نمودارهای تفکیک عملیاتی',
    operationalChartsBody: 'نشان می‌دهد سفارش‌ها در کدام مرحله عملیاتی هستند، مشتریان از چه روش‌های پرداختی استفاده می‌کنند و تخفیف‌ها چه اثری روی نمونه سفارش‌ها دارند.',
    ordersOverTime: 'سفارش‌ها در طول زمان',
    ordersOverTimeBody: 'تعداد سفارش روزانه برای بازه انتخاب‌شده.',
    revenueOverTime: 'درآمد در طول زمان',
    revenueOverTimeBody: 'درآمد روزانه قابل محاسبه برای بازه انتخاب‌شده، بدون سفارش‌های لغوشده، بازپرداخت‌شده یا باطل‌شده.',
    aovOverTime: 'میانگین ارزش سفارش در طول زمان',
    aovOverTimeBody: 'میانگین روزانه ارزش سفارش بر اساس درآمد قابل محاسبه و تعداد سفارش برای بازه انتخاب‌شده.',
    statusBreakdown: 'سفارش‌ها بر اساس وضعیت',
    statusBreakdownBody: 'نشان می‌دهد نمونه سفارش انتخاب‌شده بین وضعیت‌های چرخه سفارش چگونه توزیع شده است.',
    revenueByCurrency: 'درآمد بر اساس ارز',
    revenueByCurrencyBody: 'درآمد قابل محاسبه بر اساس ارز برای نمونه سفارش انتخاب‌شده.',
    fulfillmentByStatus: 'ارسال بر اساس وضعیت',
    fulfillmentByStatusBody: 'نشان می‌دهد سفارش‌های بازه انتخاب‌شده در کدام مرحله اجرای سفارش قرار دارند.',
    paymentProviderMix: 'ترکیب روش پرداخت',
    paymentProviderMixBody: 'تلاش‌های پرداخت را بر اساس ارائه‌دهنده/روش می‌شمارد تا تیم بداند مشتریان چگونه پرداخت می‌کنند.',
    discountImpact: 'اثر مصرف تخفیف',
    discountImpactBody: 'سفارش‌های دارای تخفیف و بدون تخفیف را مقایسه می‌کند و ارزش کل تخفیف را نشان می‌دهد.',
    discountedOrders: 'سفارش‌های دارای تخفیف',
    undiscountedOrders: 'سفارش‌های بدون تخفیف',
    totalDiscount: 'کل تخفیف',
    noChartData: 'هنوز داده تحلیلی موجود نیست.',
    dataTable: 'مشاهده جدول داده نمودار',
    count: 'تعداد',
    amount: 'مبلغ',
    attempts: 'تلاش‌ها'
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

function formatRangeLabel(days: number, locale: SupportedLocale | string | null | undefined) {
  return localeKey(locale) === 'fa' ? `${days} روز گذشته` : `last ${days} days`;
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
  const rangeLabel = formatRangeLabel(summary.analyticsRangeDays, locale);
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
  const fulfillmentChartRows = summary.byFulfillmentStatus.map((row) => ({
    label: formatStatusLabel(row.status),
    value: row.orderCount,
    displayValue: String(row.orderCount),
    detail: formatRevenueCents(row.revenueCents, primaryCurrency)
  }));
  const paymentProviderChartRows = summary.byPaymentProvider.map((row) => ({
    label: formatStatusLabel(row.provider),
    value: row.attemptCount,
    displayValue: String(row.attemptCount),
    detail: `${row.orderCount} ${labels.orders} · ${formatRevenueCents(row.amountCents, row.currency)}`
  }));
  const discountImpactChartRows = summary.totalOrders
    ? [
        {
          label: labels.discountedOrders,
          value: summary.discountImpact.discountedOrders,
          displayValue: String(summary.discountImpact.discountedOrders),
          detail: `${labels.totalDiscount}: ${formatRevenueCents(summary.discountImpact.totalDiscountCents, primaryCurrency)}`
        },
        {
          label: labels.undiscountedOrders,
          value: summary.discountImpact.undiscountedOrders,
          displayValue: String(summary.discountImpact.undiscountedOrders),
          detail: formatRevenueCents(summary.discountImpact.undiscountedRevenueCents, primaryCurrency)
        }
      ]
    : [];
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
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">
              {rangeLabel}
            </span>
            <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
              {primaryCurrency}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label={labels.totalOrders} value={summary.totalOrders} detail={rangeLabel} />
          <Metric label={labels.revenue} value={formatRevenueCents(summary.totalRevenueCents, primaryCurrency)} detail={`${labels.excludesCancelledRefunded} · ${rangeLabel}`} />
          <Metric label={labels.averageOrderValue} value={formatRevenueCents(summary.averageOrderValueCents, primaryCurrency)} detail={rangeLabel} />
          <Metric label={labels.openOrders} value={summary.openOrders} detail={rangeLabel} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Metric label={labels.recentOrders} value={summary.recentOrders} detail={rangeLabel} />
          <Metric label={labels.recentRevenue} value={formatRevenueCents(summary.recentRevenueCents, primaryCurrency)} detail={rangeLabel} />
          <Metric label={labels.completed} value={summary.completedOrders} detail={rangeLabel} />
          <Metric label={labels.cancelled} value={summary.cancelledOrders} detail={rangeLabel} />
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
          <div className="mt-4 rounded-lg border border-stone-200 bg-white/70 p-4">
            <p className="text-sm font-bold text-stone-950">{labels.operationalCharts}</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">{labels.operationalChartsBody}</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              <AdminAnalyticsBarChart
                title={labels.fulfillmentByStatus}
                description={labels.fulfillmentByStatusBody}
                rows={fulfillmentChartRows}
                emptyLabel={labels.noChartData}
                valueLabel={labels.count}
              />
              <AdminAnalyticsBarChart
                title={labels.paymentProviderMix}
                description={labels.paymentProviderMixBody}
                rows={paymentProviderChartRows}
                emptyLabel={labels.noChartData}
                valueLabel={labels.attempts}
              />
              <AdminAnalyticsBarChart
                title={labels.discountImpact}
                description={labels.discountImpactBody}
                rows={discountImpactChartRows}
                emptyLabel={labels.noChartData}
                valueLabel={labels.count}
              />
            </div>
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
