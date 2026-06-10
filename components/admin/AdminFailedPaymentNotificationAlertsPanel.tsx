import type { FailedPaymentNotificationAlertsSummary } from '@/lib/analytics/failed-payment-notification-alerts';
import type { SupportedLocale } from '@/lib/i18n/locales';
import {
  formatAdminFailedPaymentAlertKind,
  formatAdminFailedPaymentAlertStatus,
  formatAdminFailedPaymentAlertTitle,
  formatAdminFailedPaymentNotificationDetail
} from '@/lib/localization/admin-failed-payment-alerts-copy';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Failed payment and notification alerts',
    body: 'Operational alerts for failed payment attempts and failed or retry-scheduled order notifications.',
    alerts: 'alerts',
    failedPayments: 'Failed payments',
    failedNotifications: 'Failed notifications',
    retryScheduled: 'Retry scheduled',
    alertSources: 'Alert sources',
    alert: 'Alert',
    order: 'Order',
    kind: 'Kind',
    status: 'Status',
    empty: 'No failed payment attempts or failed/retry-scheduled notifications need attention right now.'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'هشدارهای پرداخت و اعلان ناموفق',
    body: 'هشدارهای عملیاتی برای تلاش‌های پرداخت ناموفق و اعلان‌های سفارش ناموفق یا زمان‌بندی‌شده برای تلاش دوباره.',
    alerts: 'هشدار',
    failedPayments: 'پرداخت‌های ناموفق',
    failedNotifications: 'اعلان‌های ناموفق',
    retryScheduled: 'تلاش دوباره زمان‌بندی‌شده',
    alertSources: 'منابع هشدار',
    alert: 'هشدار',
    order: 'سفارش',
    kind: 'نوع',
    status: 'وضعیت',
    empty: 'در حال حاضر هیچ پرداخت ناموفق یا اعلان نیازمند پیگیری وجود ندارد.'
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

export function AdminFailedPaymentNotificationAlertsPanel({ summary, locale }: { summary: FailedPaymentNotificationAlertsSummary; locale?: SupportedLocale | string | null }) {
  const labels = copy[localeKey(locale)];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
          {summary.totalAlerts} {labels.alerts}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label={labels.failedPayments} value={summary.failedPayments} />
        <Metric label={labels.failedNotifications} value={summary.failedNotifications} />
        <Metric label={labels.retryScheduled} value={summary.retryScheduledNotifications} />
        <Metric label={labels.alertSources} value={summary.byKind.length} />
      </div>
      {summary.alerts.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">{labels.alert}</th>
                <th className="px-3 py-2">{labels.order}</th>
                <th className="px-3 py-2">{labels.kind}</th>
                <th className="px-3 py-2">{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {summary.alerts.map((row) => (
                <tr key={row.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{formatAdminFailedPaymentAlertTitle(row, locale)}</p>
                    <p className="text-xs text-stone-500">{formatAdminFailedPaymentNotificationDetail(row, locale)}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.orderNumber}</td>
                  <td className="px-3 py-2 text-stone-700">{formatAdminFailedPaymentAlertKind(row.kind, locale)}</td>
                  <td className="px-3 py-2 text-stone-700">{formatAdminFailedPaymentAlertStatus(row.status, locale)}</td>
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
