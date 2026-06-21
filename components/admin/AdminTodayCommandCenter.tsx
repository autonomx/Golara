import Link from 'next/link';
import type { AdminTodayCard, AdminTodaySeverity } from '@/lib/admin/admin-today-cards';
import type { SupportedLocale } from '@/lib/i18n/locales';

const severityClasses: Record<AdminTodaySeverity, string> = {
  critical: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-rosewood/15 bg-white text-stone-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950'
};

const severityBadgeClasses: Record<AdminTodaySeverity, string> = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-cream text-rosewood',
  success: 'bg-emerald-100 text-emerald-800'
};

const copy = {
  en: {
    eyebrow: 'Today',
    title: 'Priority queue',
    body: 'A compact view of the work that needs attention now, generated from current products, orders, inquiries, payments, and readiness data.',
    countLabel: 'items',
    readiness: 'Readiness'
  },
  fa: {
    eyebrow: 'امروز',
    title: 'صف اولویت‌ها',
    body: 'نمای فشرده‌ای از کارهای فوری که از وضعیت محصولات، سفارش‌ها، درخواست‌ها، پرداخت و آمادگی ساخته می‌شود.',
    countLabel: 'مورد',
    readiness: 'آمادگی'
  }
} as const;

function adminLocale(locale?: SupportedLocale | string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function AdminTodayCommandCenter({ cards, locale }: { cards: AdminTodayCard[]; locale?: SupportedLocale | string | null }) {
  const labels = copy[adminLocale(locale)];
  const visibleCards = cards.slice(0, 5);

  return (
    <section className="rounded-2xl border border-rosewood/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-olive">{labels.eyebrow}</p>
          <h2 className="mt-1 font-display text-2xl text-rosewood">{labels.title}</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <Link href="/admin/readiness" className="rounded-full border border-rosewood/20 px-4 py-2 text-sm font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
          {labels.readiness}
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {visibleCards.map((card) => (
          <Link key={card.id} href={card.href} className={`group rounded-xl border p-3 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-olive/20 ${severityClasses[card.severity]}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold leading-5">{card.label}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${severityBadgeClasses[card.severity]}`}>
                {card.count} {labels.countLabel}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 opacity-80">{card.detail}</p>
            <span className="mt-3 inline-flex text-xs font-bold text-rosewood underline-offset-4 group-hover:underline">
              {card.cta} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
