import type { LaunchReadinessHealthSummary } from '@/lib/analytics/launch-readiness-health';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Analytics',
    title: 'Launch readiness health cards',
    body: 'Condensed production-readiness cards for blockers, warnings, and ready systems.',
    ready: 'Ready',
    warning: 'Warning',
    warnings: 'Warnings',
    blocked: 'Blocked'
  },
  fa: {
    eyebrow: 'تحلیل‌ها',
    title: 'کارت‌های سلامت آمادگی راه‌اندازی',
    body: 'کارت‌های خلاصه آمادگی تولید برای موارد آماده، هشدارها و انسدادها.',
    ready: 'آماده',
    warning: 'هشدار',
    warnings: 'هشدارها',
    blocked: 'مسدود'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

const statusClasses = {
  ready: 'border-olive/25 bg-olive/5 text-olive',
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  blocked: 'border-red-200 bg-red-50 text-red-800'
} as const;

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
    </div>
  );
}

export function AdminLaunchReadinessHealthPanel({ summary, locale }: { summary: LaunchReadinessHealthSummary; locale?: SupportedLocale | string | null }) {
  const labels = copy[localeKey(locale)];
  const statusLabels = {
    ready: labels.ready,
    warning: labels.warning,
    blocked: labels.blocked
  } as const;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.launchBlocked ? 'bg-rose-100 text-rose-700' : 'bg-olive/10 text-olive'}`}>
          {summary.launchBlocked ? labels.blocked : labels.ready}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Metric label={labels.ready} value={summary.readyCount} />
        <Metric label={labels.warnings} value={summary.warningCount} />
        <Metric label={labels.blocked} value={summary.blockedCount} />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {summary.cards.map((card) => (
          <article key={card.key} className={`rounded-md border p-4 text-sm ${statusClasses[card.status]}`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-stone-950">{card.label}</h3>
              <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">{statusLabels[card.status]}</span>
            </div>
            <p className="mt-3 font-semibold">{card.summary}</p>
            <p className="mt-2 leading-6 text-stone-700">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
