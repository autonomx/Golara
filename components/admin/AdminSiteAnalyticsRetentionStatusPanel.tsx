import type { SiteAnalyticsRetentionSummary } from '@/lib/analytics/site-analytics-retention';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Site analytics retention',
    title: 'Raw event retention status',
    body: 'Read-only privacy operations status for the first-party site analytics table. Use this to confirm the migration is present and whether old raw events are past the retention target before adding an automated cleanup job.',
    databaseMissing: 'DATABASE_URL is not configured, so retention status cannot be checked yet.',
    tableMissing: 'Site analytics table is not available yet. Apply the site analytics migration before expecting events or retention counts.',
    ready: 'Site analytics table is available.',
    total: 'Total raw events',
    retained: 'Within retention target',
    stale: 'Past retention target',
    cutoff: 'Retention cutoff',
    oldest: 'Oldest event',
    newest: 'Newest event',
    generated: 'Generated',
    retentionTarget: 'Retention target',
    days: 'days',
    none: 'None yet',
    cleanupPending: 'Automated cleanup is still planned. This panel is status-only and does not delete events.'
  },
  fa: {
    eyebrow: 'نگهداری تحلیل سایت',
    title: 'وضعیت نگهداری رویداد خام',
    body: 'وضعیت فقط‌خواندنی عملیات حریم خصوصی برای جدول تحلیل داخلی سایت. از این بخش برای بررسی وجود مهاجرت و رویدادهای خام قدیمی پیش از افزودن پاک‌سازی خودکار استفاده کنید.',
    databaseMissing: 'DATABASE_URL تنظیم نشده است، بنابراین وضعیت نگهداری هنوز قابل بررسی نیست.',
    tableMissing: 'جدول تحلیل سایت هنوز در دسترس نیست. پیش از انتظار رویداد یا شمارش نگهداری، مهاجرت تحلیل سایت را اعمال کنید.',
    ready: 'جدول تحلیل سایت در دسترس است.',
    total: 'کل رویدادهای خام',
    retained: 'در هدف نگهداری',
    stale: 'گذشته از هدف نگهداری',
    cutoff: 'مرز نگهداری',
    oldest: 'قدیمی‌ترین رویداد',
    newest: 'جدیدترین رویداد',
    generated: 'تولیدشده',
    retentionTarget: 'هدف نگهداری',
    days: 'روز',
    none: 'هنوز موردی نیست',
    cleanupPending: 'پاک‌سازی خودکار هنوز در برنامه است. این پنل فقط وضعیت را نشان می‌دهد و رویدادی را حذف نمی‌کند.'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatDate(value: Date | null, locale: SupportedLocale | string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(value);
}

function StatusMetric({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'warning' | 'success' }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-950'
    : tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : 'border-stone-200 bg-stone-50 text-stone-950';

  return (
    <div className={`rounded-md border p-3 text-sm ${toneClass}`}>
      <p className="font-bold">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">{label}</p>
    </div>
  );
}

export async function AdminSiteAnalyticsRetentionStatusPanel({ summary }: { summary: SiteAnalyticsRetentionSummary }) {
  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const statusText = !summary.databaseConfigured
    ? labels.databaseMissing
    : !summary.tableAvailable
      ? labels.tableMissing
      : labels.ready;

  return (
    <section id="site-analytics-retention-status" className="scroll-mt-24 rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-800">
          {labels.retentionTarget}: {summary.retentionDays} {labels.days}
        </span>
      </div>
      <p className={`mt-4 rounded-md border px-4 py-3 text-sm font-semibold ${summary.tableAvailable ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
        {statusText}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusMetric label={labels.total} value={summary.totalEventCount} />
        <StatusMetric label={labels.retained} value={summary.retainedEventCount} tone="success" />
        <StatusMetric label={labels.stale} value={summary.staleEventCount} tone={summary.staleEventCount > 0 ? 'warning' : 'neutral'} />
        <StatusMetric label={labels.cutoff} value={formatDate(summary.cutoffAt, locale, labels.none)} />
        <StatusMetric label={labels.oldest} value={formatDate(summary.oldestEventAt, locale, labels.none)} />
        <StatusMetric label={labels.newest} value={formatDate(summary.newestEventAt, locale, labels.none)} />
        <StatusMetric label={labels.generated} value={formatDate(summary.generatedAt, locale, labels.none)} />
        <StatusMetric label={labels.retentionTarget} value={`${summary.retentionDays} ${labels.days}`} />
      </div>
      <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
        {labels.cleanupPending}
      </p>
    </section>
  );
}
