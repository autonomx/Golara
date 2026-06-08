import type { CustomerInquiry } from '@/lib/catalog';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    followUps: 'Follow-ups',
    latest: 'Latest',
    empty: 'No follow-up activity yet.'
  },
  fa: {
    followUps: 'پیگیری‌ها',
    latest: 'آخرین',
    empty: 'هنوز هیچ فعالیت پیگیری ثبت نشده است.'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatDate(value: Date, locale?: SupportedLocale | string | null) {
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export async function InquiryFollowUpSummary({ inquiry, locale }: { inquiry: CustomerInquiry; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const labels = copy[localeKey(activeLocale)];
  const followUps = inquiry.followUps ?? [];
  const latest = followUps[0];

  return (
    <div className="mt-4 rounded-2xl border border-rosewood/10 bg-white p-3 text-sm text-stone-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-rosewood">{labels.followUps}: {followUps.length}</span>
        {latest ? <span className="text-xs uppercase tracking-[0.16em] text-rosewood/50">{labels.latest} {formatDate(latest.createdAt, activeLocale)}</span> : null}
      </div>
      {latest ? <p className="mt-2 line-clamp-2 leading-6">{latest.note}</p> : <p className="mt-2 leading-6 text-stone-500">{labels.empty}</p>}
    </div>
  );
}
