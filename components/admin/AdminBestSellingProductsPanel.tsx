import { formatBestSellingRevenue, type BestSellingProductsSummary } from '@/lib/analytics/best-selling-products';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Best-selling products',
    body: 'Sales-derived product leaderboard from recent checkout line items, excluding cancelled and refunded orders.',
    unitsSold: 'units sold',
    rankedProducts: 'Ranked products',
    recentUnits: 'Recent units',
    last30Days: 'last 30 days',
    leaderboardRevenue: 'Leaderboard revenue',
    product: 'Product',
    units: 'Units',
    orders: 'Orders',
    revenue: 'Revenue',
    recent: 'Recent',
    noCode: 'No code',
    empty: 'No eligible checkout line items are available yet, so best-selling products will appear after completed sales data exists.'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'محصولات پرفروش',
    body: 'رتبه‌بندی محصول بر اساس ردیف‌های سفارش اخیر، بدون سفارش‌های لغوشده و بازپرداخت‌شده.',
    unitsSold: 'واحد فروخته‌شده',
    rankedProducts: 'محصولات رتبه‌بندی‌شده',
    recentUnits: 'واحدهای اخیر',
    last30Days: '۳۰ روز گذشته',
    leaderboardRevenue: 'درآمد رتبه‌بندی',
    product: 'محصول',
    units: 'واحدها',
    orders: 'سفارش‌ها',
    revenue: 'درآمد',
    recent: 'اخیر',
    noCode: 'بدون کد',
    empty: 'هنوز ردیف سفارش واجد شرایطی وجود ندارد؛ محصولات پرفروش پس از ثبت فروش‌های تکمیل‌شده نمایش داده می‌شوند.'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function AdminBestSellingProductsPanel({ summary, locale }: { summary: BestSellingProductsSummary; locale?: SupportedLocale | string | null }) {
  const labels = copy[localeKey(locale)];
  const primaryCurrency = summary.products[0]?.currency ?? 'CAD';

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
          {summary.totalQuantitySold} {labels.unitsSold}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          <p className="font-bold text-stone-950">{summary.products.length}</p>
          <p className="text-stone-600">{labels.rankedProducts}</p>
        </div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          <p className="font-bold text-stone-950">{summary.recentQuantitySold}</p>
          <p className="text-stone-600">{labels.recentUnits}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{labels.last30Days}</p>
        </div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          <p className="font-bold text-stone-950">{formatBestSellingRevenue(summary.totalRevenueCents, primaryCurrency)}</p>
          <p className="text-stone-600">{labels.leaderboardRevenue}</p>
        </div>
      </div>
      {summary.products.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">{labels.product}</th>
                <th className="px-3 py-2">{labels.units}</th>
                <th className="px-3 py-2">{labels.orders}</th>
                <th className="px-3 py-2">{labels.revenue}</th>
                <th className="px-3 py-2">{labels.recent}</th>
              </tr>
            </thead>
            <tbody>
              {summary.products.map((row) => (
                <tr key={row.productId} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.productTitle}</p>
                    <p className="text-xs text-stone-500">{row.productCode ?? labels.noCode}{row.variantNames.length ? ` · ${row.variantNames.join(', ')}` : ''}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.quantitySold}</td>
                  <td className="px-3 py-2 text-stone-700">{row.orderCount}</td>
                  <td className="px-3 py-2 text-stone-700">{formatBestSellingRevenue(row.revenueCents, row.currency)}</td>
                  <td className="px-3 py-2 text-stone-700">{row.recentQuantitySold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          {labels.empty}
        </div>
      )}
    </section>
  );
}
