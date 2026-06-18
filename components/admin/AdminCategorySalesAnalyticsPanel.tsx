import { AdminAnalyticsBarChart } from '@/components/admin/AdminAnalyticsChartPrimitives';
import { formatRevenueCents } from '@/lib/analytics/order-revenue-summary';
import type { CategorySalesAnalyticsSummary } from '@/lib/analytics/category-sales-analytics';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Category sales analytics',
    title: 'Category sales performance',
    body: 'Order-line sales signals grouped by product category in the selected range. Cancelled, refunded, and voided orders are excluded from revenue and unit counts.',
    unitsSold: 'Units sold by category',
    unitsSoldBody: 'Shows which categories are moving by quantity sold in eligible orders.',
    revenueByCategory: 'Revenue by category',
    revenueByCategoryBody: 'Eligible order-line revenue grouped by category for the selected range.',
    category: 'Category',
    units: 'Units',
    orders: 'Orders',
    revenue: 'Revenue',
    averageUnit: 'Avg unit',
    noData: 'No category sales data is available for this range.',
    rangeSuffix: 'days'
  },
  fa: {
    eyebrow: 'تحلیل فروش دسته‌بندی',
    title: 'عملکرد فروش دسته‌بندی',
    body: 'سیگنال‌های فروش خط سفارش بر اساس دسته‌بندی محصول در بازه انتخاب‌شده. سفارش‌های لغوشده، بازپرداخت‌شده و باطل‌شده از درآمد و تعداد واحد حذف می‌شوند.',
    unitsSold: 'واحدهای فروخته‌شده بر اساس دسته‌بندی',
    unitsSoldBody: 'نشان می‌دهد کدام دسته‌بندی‌ها از نظر تعداد فروش در سفارش‌های معتبر حرکت دارند.',
    revenueByCategory: 'درآمد بر اساس دسته‌بندی',
    revenueByCategoryBody: 'درآمد خط سفارش معتبر، گروه‌بندی‌شده بر اساس دسته‌بندی برای بازه انتخاب‌شده.',
    category: 'دسته‌بندی',
    units: 'واحد',
    orders: 'سفارش‌ها',
    revenue: 'درآمد',
    averageUnit: 'میانگین واحد',
    noData: 'برای این بازه داده فروش دسته‌بندی موجود نیست.',
    rangeSuffix: 'روز'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export async function AdminCategorySalesAnalyticsPanel({ summary }: { summary: CategorySalesAnalyticsSummary }) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const rangeLabel = localeKey(locale) === 'fa' ? `${summary.analyticsRangeDays} ${labels.rangeSuffix}` : `last ${summary.analyticsRangeDays} ${labels.rangeSuffix}`;
  const unitRows = summary.rows.map((row) => ({
    label: row.label,
    value: row.quantitySold,
    displayValue: String(row.quantitySold),
    detail: `${row.orderCount} ${labels.orders} · ${formatRevenueCents(row.revenueCents, row.currency)}`
  }));
  const revenueRows = summary.rows.map((row) => ({
    label: row.label,
    value: row.revenueCents,
    displayValue: formatRevenueCents(row.revenueCents, row.currency),
    detail: `${row.quantitySold} ${labels.units} · ${labels.averageUnit}: ${formatRevenueCents(row.averageUnitRevenueCents, row.currency)}`
  }));

  return (
    <section id="category-sales-analytics" className="scroll-mt-24 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">
          {rangeLabel}
        </span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AdminAnalyticsBarChart
          title={labels.unitsSold}
          description={labels.unitsSoldBody}
          rows={unitRows}
          emptyLabel={labels.noData}
          valueLabel={labels.units}
        />
        <AdminAnalyticsBarChart
          title={labels.revenueByCategory}
          description={labels.revenueByCategoryBody}
          rows={revenueRows}
          emptyLabel={labels.noData}
          valueLabel={labels.revenue}
        />
      </div>
      {summary.rows.length ? (
        <div className="mt-5 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">{labels.category}</th>
                <th className="px-3 py-2">{labels.units}</th>
                <th className="px-3 py-2">{labels.orders}</th>
                <th className="px-3 py-2">{labels.revenue}</th>
                <th className="px-3 py-2">{labels.averageUnit}</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr key={row.categoryId} className="border-t border-stone-200">
                  <td className="px-3 py-2 font-semibold text-stone-950">{row.label}</td>
                  <td className="px-3 py-2 text-stone-700">{row.quantitySold}</td>
                  <td className="px-3 py-2 text-stone-700">{row.orderCount}</td>
                  <td className="px-3 py-2 text-stone-700">{formatRevenueCents(row.revenueCents, row.currency)}</td>
                  <td className="px-3 py-2 text-stone-700">{formatRevenueCents(row.averageUnitRevenueCents, row.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
