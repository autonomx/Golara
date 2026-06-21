import Link from 'next/link';
import type { AdminTodayCard } from '@/lib/admin/admin-today-cards';
import { buildAdminOverviewActionGroups, primaryAdminOverviewAction } from '@/lib/admin/admin-overview-actions';
import type { SupportedLocale } from '@/lib/i18n/locales';

const copy = {
  en: {
    eyebrow: 'Action dashboard',
    title: 'What to do next',
    body: 'The overview now turns health signals into action queues. Start with the highest-priority item, then work through the grouped queues.',
    primary: 'Top priority',
    none: 'No action required'
  },
  fa: {
    eyebrow: 'داشبورد اقدام',
    title: 'قدم بعدی چیست',
    body: 'نمای کلی، وضعیت فروشگاه را به صف‌های کاری تبدیل می‌کند. ابتدا مورد با بیشترین اولویت را انجام دهید و سپس سراغ گروه‌های بعدی بروید.',
    primary: 'اولویت اصلی',
    none: 'اقدامی لازم نیست'
  }
} as const;

function adminLocale(locale?: SupportedLocale | string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function AdminOverviewActionDashboard({ cards, locale }: { cards: AdminTodayCard[]; locale?: SupportedLocale | string | null }) {
  const labels = copy[adminLocale(locale)];
  const primary = primaryAdminOverviewAction(cards);
  const groups = buildAdminOverviewActionGroups(cards);

  return (
    <section className="rounded-2xl border border-rosewood/10 bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-olive">{labels.eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">{labels.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
        </div>
        <div className="rounded-xl border border-rosewood/10 bg-cream p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{labels.primary}</p>
          {primary ? (
            <div className="mt-3">
              <p className="text-lg font-bold text-stone-950">{primary.label}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{primary.detail}</p>
              <Link href={primary.href} className="mt-4 inline-flex rounded-full bg-rosewood px-4 py-2 text-sm font-bold text-white shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                {primary.cta}
              </Link>
            </div>
          ) : <p className="mt-3 text-sm font-semibold text-stone-600">{labels.none}</p>}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-xl border border-stone-200 bg-[#fffdfb] p-4">
            <h3 className="text-base font-bold text-stone-950">{group.title}</h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">{group.description}</p>
            <div className="mt-4 grid gap-2">
              {group.cards.slice(0, 4).map((card) => (
                <Link key={card.id} href={card.href} className="rounded-lg border border-rosewood/10 bg-white px-3 py-2 text-sm outline-none transition hover:border-rosewood/30 focus-visible:ring-4 focus-visible:ring-olive/20">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-stone-900">{card.label}</span>
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-bold text-rosewood">{card.count}</span>
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-rosewood">{card.cta} →</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
