import type { LowStockAlertsSummary } from '@/lib/analytics/low-stock-alerts';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Low-stock alerts',
    body: 'Operational inventory alerts for active tracked variants that need stock review.',
    alerts: 'alerts',
    trackedVariants: 'Tracked variants',
    unavailable: 'Out of stock',
    lowStock: 'Low stock',
    untracked: 'Untracked',
    inactive: 'Inactive',
    variant: 'Variant',
    status: 'Status',
    onHand: 'On hand',
    threshold: 'Threshold',
    canSell: 'Can sell',
    notSet: 'Not set',
    yes: 'Yes',
    no: 'No',
    empty: 'No tracked variants need attention right now.'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'هشدارهای موجودی',
    body: 'هشدارهای عملیاتی موجودی برای گونه‌های فعال و رهگیری‌شده که نیازمند بررسی هستند.',
    alerts: 'هشدار',
    trackedVariants: 'گونه‌های رهگیری‌شده',
    unavailable: 'ناموجود',
    lowStock: 'کمبود موجودی',
    untracked: 'رهگیری‌نشده',
    inactive: 'غیرفعال',
    variant: 'گونه',
    status: 'وضعیت',
    onHand: 'موجودی',
    threshold: 'آستانه',
    canSell: 'قابل فروش',
    notSet: 'تنظیم نشده',
    yes: 'بله',
    no: 'خیر',
    empty: 'در حال حاضر هیچ گونه رهگیری‌شده‌ای نیازمند توجه نیست.'
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

export function AdminLowStockAlertsPanel({ summary, locale }: { summary: LowStockAlertsSummary; locale?: SupportedLocale | string | null }) {
  const labels = copy[localeKey(locale)];
  const alertCount = summary.lowStockVariants + summary.outOfStockVariants;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
          {alertCount} {labels.alerts}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <Metric label={labels.trackedVariants} value={summary.trackedVariants} />
        <Metric label={labels.unavailable} value={summary.outOfStockVariants} />
        <Metric label={labels.lowStock} value={summary.lowStockVariants} />
        <Metric label={labels.untracked} value={summary.untrackedVariants} />
        <Metric label={labels.inactive} value={summary.inactiveVariants} />
      </div>
      {summary.alerts.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">{labels.variant}</th>
                <th className="px-3 py-2">{labels.status}</th>
                <th className="px-3 py-2">{labels.onHand}</th>
                <th className="px-3 py-2">{labels.threshold}</th>
                <th className="px-3 py-2">{labels.canSell}</th>
              </tr>
            </thead>
            <tbody>
              {summary.alerts.map((row) => (
                <tr key={row.variantId} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.productTitle} / {row.variantName}</p>
                    <p className="text-xs text-stone-500">{row.productCode} · {row.sku}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-900">{row.statusLabel}</p>
                    <p className="text-xs text-stone-500">{row.detail}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.stockQuantity}</td>
                  <td className="px-3 py-2 text-stone-700">{row.lowStockThreshold ?? labels.notSet}</td>
                  <td className="px-3 py-2 text-stone-700">{row.canSell ? labels.yes : labels.no}</td>
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
