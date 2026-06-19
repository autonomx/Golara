import type { SiteAnalyticsRetentionSummary } from '@/lib/analytics/site-analytics-retention';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';
type ReadinessTone = 'success' | 'warning' | 'blocked';

type CleanupReasonLabels = {
  reasonDatabase: string;
  reasonTable: string;
  reasonEvidence: string;
  reasonNoStale: string;
  reasonReady: string;
};

const copy = {
  en: {
    eyebrow: 'Site analytics retention',
    title: 'Raw event retention status',
    body: 'Read-only privacy operations status for the first-party site analytics table. Use this to confirm the migration is present, preview eligible stale events, and verify cleanup gates before any future deletion job is enabled.',
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
    cleanupPending: 'Automated deletion remains disabled. This panel only previews stale raw-event eligibility and readiness gates.',
    cleanupPreviewTitle: 'Cleanup preview',
    cleanupPreviewBody: 'Preview-only estimate for raw events older than the retention cutoff. It does not delete events and stays blocked until production migration evidence is confirmed.',
    cleanupEligible: 'Eligible stale events',
    cleanupDeletion: 'Deletion action',
    cleanupEvidence: 'Production evidence',
    cleanupReason: 'Preview reason',
    deletionOff: 'Disabled',
    evidenceConfirmed: 'Confirmed',
    evidenceMissing: 'Required',
    reasonDatabase: 'Database connection required',
    reasonTable: 'Site analytics table required',
    reasonEvidence: 'Production evidence required',
    reasonNoStale: 'No stale events to clean',
    reasonReady: 'Ready for future guarded cleanup',
    readinessTitle: 'Cleanup readiness checklist',
    readinessBody: 'Use these checks before enabling any deletion job. Raw event cleanup must stay disabled until production migration and analytics-volume evidence are confirmed.',
    statusReady: 'Ready',
    statusReview: 'Review',
    statusBlocked: 'Blocked',
    databaseReady: 'Database connection is configured',
    databaseBlocked: 'Configure DATABASE_URL before retention cleanup can be evaluated.',
    tableReady: 'Site analytics table is available',
    tableBlocked: 'Apply the site analytics migration before enabling cleanup.',
    staleReview: 'Old raw events need cleanup review',
    staleReady: 'No stale raw events are currently past the retention target.',
    deletionDisabled: 'Deletion action remains disabled in this slice',
    productionEvidence: 'Require production migration evidence before enabling automated deletion.',
    aggregateOnly: 'Keep exports aggregate-only; do not expose raw visitor/session exports.'
  },
  fa: {
    eyebrow: 'نگهداری تحلیل سایت',
    title: 'وضعیت نگهداری رویداد خام',
    body: 'وضعیت فقط‌خواندنی عملیات حریم خصوصی برای جدول تحلیل داخلی سایت. از این بخش برای بررسی وجود مهاجرت، پیش‌نمایش رویدادهای خام قدیمی واجد شرایط، و بررسی دروازه‌های پاک‌سازی پیش از فعال‌سازی هر کار حذف آینده استفاده کنید.',
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
    cleanupPending: 'حذف خودکار غیرفعال می‌ماند. این پنل فقط واجد شرایط بودن رویداد خام قدیمی و دروازه‌های آمادگی را پیش‌نمایش می‌کند.',
    cleanupPreviewTitle: 'پیش‌نمایش پاک‌سازی',
    cleanupPreviewBody: 'برآورد فقط‌خواندنی برای رویدادهای خام قدیمی‌تر از مرز نگهداری. رویدادی را حذف نمی‌کند و تا تأیید شواهد مهاجرت تولید مسدود می‌ماند.',
    cleanupEligible: 'رویدادهای قدیمی واجد شرایط',
    cleanupDeletion: 'اقدام حذف',
    cleanupEvidence: 'شواهد تولید',
    cleanupReason: 'دلیل پیش‌نمایش',
    deletionOff: 'غیرفعال',
    evidenceConfirmed: 'تأیید شده',
    evidenceMissing: 'لازم است',
    reasonDatabase: 'اتصال پایگاه داده لازم است',
    reasonTable: 'جدول تحلیل سایت لازم است',
    reasonEvidence: 'شواهد تولید لازم است',
    reasonNoStale: 'رویداد قدیمی برای پاک‌سازی وجود ندارد',
    reasonReady: 'آماده برای پاک‌سازی محافظت‌شده آینده',
    readinessTitle: 'چک‌لیست آمادگی پاک‌سازی',
    readinessBody: 'پیش از فعال‌کردن هر کار حذف، این بررسی‌ها را انجام دهید. پاک‌سازی رویداد خام باید تا تأیید مهاجرت تولید و شواهد حجم تحلیل غیرفعال بماند.',
    statusReady: 'آماده',
    statusReview: 'نیازمند بررسی',
    statusBlocked: 'مسدود',
    databaseReady: 'اتصال پایگاه داده تنظیم شده است',
    databaseBlocked: 'پیش از ارزیابی پاک‌سازی نگهداری، DATABASE_URL را تنظیم کنید.',
    tableReady: 'جدول تحلیل سایت در دسترس است',
    tableBlocked: 'پیش از فعال‌کردن پاک‌سازی، مهاجرت تحلیل سایت را اعمال کنید.',
    staleReview: 'رویدادهای خام قدیمی نیازمند بررسی پاک‌سازی هستند',
    staleReady: 'در حال حاضر هیچ رویداد خام قدیمی خارج از هدف نگهداری نیست.',
    deletionDisabled: 'اقدام حذف در این مرحله غیرفعال می‌ماند',
    productionEvidence: 'پیش از فعال‌کردن حذف خودکار، شواهد مهاجرت تولید لازم است.',
    aggregateOnly: 'خروجی‌ها را تجمیعی نگه دارید؛ خروجی خام بازدیدکننده یا نشست ارائه نکنید.'
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

function cleanupReasonLabel(reason: SiteAnalyticsRetentionSummary['cleanupPreview']['reason'], labels: CleanupReasonLabels) {
  switch (reason) {
    case 'database_not_configured':
      return labels.reasonDatabase;
    case 'table_unavailable':
      return labels.reasonTable;
    case 'production_evidence_required':
      return labels.reasonEvidence;
    case 'no_stale_events':
      return labels.reasonNoStale;
    case 'preview_ready':
      return labels.reasonReady;
  }
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

function ReadinessItem({ label, status, tone }: { label: string; status: string; tone: ReadinessTone }) {
  const toneClass = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : 'border-rose-200 bg-rose-50 text-rose-950';

  return (
    <li className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm ${toneClass}`}>
      <span className="leading-6">{label}</span>
      <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-xs font-bold uppercase tracking-[0.12em]">{status}</span>
    </li>
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
  const hasStaleEvents = summary.staleEventCount > 0;
  const cleanupPreview = summary.cleanupPreview;

  const readinessItems = [
    {
      label: summary.databaseConfigured ? labels.databaseReady : labels.databaseBlocked,
      status: summary.databaseConfigured ? labels.statusReady : labels.statusBlocked,
      tone: summary.databaseConfigured ? 'success' : 'blocked'
    },
    {
      label: summary.tableAvailable ? labels.tableReady : labels.tableBlocked,
      status: summary.tableAvailable ? labels.statusReady : labels.statusBlocked,
      tone: summary.tableAvailable ? 'success' : 'blocked'
    },
    {
      label: hasStaleEvents ? labels.staleReview : labels.staleReady,
      status: hasStaleEvents ? labels.statusReview : labels.statusReady,
      tone: hasStaleEvents ? 'warning' : 'success'
    },
    {
      label: labels.deletionDisabled,
      status: labels.statusBlocked,
      tone: 'blocked'
    },
    {
      label: labels.productionEvidence,
      status: cleanupPreview.productionEvidenceConfirmed ? labels.statusReady : labels.statusReview,
      tone: cleanupPreview.productionEvidenceConfirmed ? 'success' : 'warning'
    },
    {
      label: labels.aggregateOnly,
      status: labels.statusReady,
      tone: 'success'
    }
  ] satisfies Array<{ label: string; status: string; tone: ReadinessTone }>;

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
        <StatusMetric label={labels.stale} value={summary.staleEventCount} tone={hasStaleEvents ? 'warning' : 'neutral'} />
        <StatusMetric label={labels.cutoff} value={formatDate(summary.cutoffAt, locale, labels.none)} />
        <StatusMetric label={labels.oldest} value={formatDate(summary.oldestEventAt, locale, labels.none)} />
        <StatusMetric label={labels.newest} value={formatDate(summary.newestEventAt, locale, labels.none)} />
        <StatusMetric label={labels.generated} value={formatDate(summary.generatedAt, locale, labels.none)} />
        <StatusMetric label={labels.retentionTarget} value={`${summary.retentionDays} ${labels.days}`} />
      </div>
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-900">{labels.cleanupPreviewTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-blue-950">{labels.cleanupPreviewBody}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusMetric label={labels.cleanupEligible} value={cleanupPreview.eligibleEventCount} tone={cleanupPreview.eligibleEventCount > 0 ? 'warning' : 'neutral'} />
          <StatusMetric label={labels.cleanupDeletion} value={cleanupPreview.deletionEnabled ? labels.statusReady : labels.deletionOff} tone="warning" />
          <StatusMetric label={labels.cleanupEvidence} value={cleanupPreview.productionEvidenceConfirmed ? labels.evidenceConfirmed : labels.evidenceMissing} tone={cleanupPreview.productionEvidenceConfirmed ? 'success' : 'warning'} />
          <StatusMetric label={labels.cleanupReason} value={cleanupReasonLabel(cleanupPreview.reason, labels)} tone={cleanupPreview.readyForFutureCleanup ? 'success' : 'warning'} />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-800">{labels.readinessTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">{labels.readinessBody}</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {readinessItems.map((item) => (
            <ReadinessItem key={item.label} label={item.label} status={item.status} tone={item.tone} />
          ))}
        </ul>
      </div>
      <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
        {labels.cleanupPending}
      </p>
    </section>
  );
}
