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
    title: 'Command center',
    body: 'Start with the work that needs attention now. These cards are generated from current products, orders, inquiries, payments, and readiness data.',
    countLabel: 'items'
  },
  fa: {
    eyebrow: 'امروز',
    title: 'مرکز فرمان',
    body: 'کارهای فوری را از همین‌جا شروع کنید. این کارت‌ها از وضعیت محصولات، سفارش‌ها، درخواست‌ها، پرداخت و آمادگی ساخته می‌شوند.',
    countLabel: 'مورد'
  }
} as const;

function adminLocale(locale?: SupportedLocale | string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function AdminTodayCommandCenter({ cards, locale }: { cards: AdminTodayCard[]; locale?: SupportedLocale | string | null }) {
  const labels = copy[adminLocale(locale)];

  return (
    <section className="rounded-2xl border border-rosewood/10 bg-[#fffdfb] p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-olive">{labels.eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <Link href="/admin/readiness" className="rounded-full border border-rosewood/20 px-4 py-2 text-sm font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
          Readiness
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.id} href={card.href} className={`group rounded-xl border p-4 shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-olive/20 ${severityClasses[card.severity]}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{card.label}</p>
                <p className="mt-2 text-sm leading-6 opacity-80">{card.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${severityBadgeClasses[card.severity]}`}>
                {card.count} {labels.countLabel}
              </span>
            </div>
            <span className="mt-4 inline-flex text-sm font-bold text-rosewood underline-offset-4 group-hover:underline">
              {card.cta} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
