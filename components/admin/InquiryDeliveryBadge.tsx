import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

type DeliveryBadgeState = {
  label: string;
  className: string;
};

const copy = {
  en: {
    noDate: 'No delivery date',
    past: 'Past delivery date',
    today: 'Due today',
    inDay: (days: number) => `Due in ${days} day${days === 1 ? '' : 's'}`,
    inDays: (days: number) => `Due in ${days} days`
  },
  fa: {
    noDate: 'بدون تاریخ تحویل',
    past: 'تاریخ تحویل گذشته',
    today: 'موعد امروز',
    inDay: (days: number) => `${days} روز تا تحویل`,
    inDays: (days: number) => `${days} روز تا تحویل`
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function daysUntil(value: Date) {
  const today = startOfToday();
  const delivery = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  return Math.round((delivery.getTime() - today.getTime()) / 86400000);
}

function deliveryState(deliveryDate: Date | undefined, locale: SupportedLocale | string | null | undefined): DeliveryBadgeState {
  const labels = copy[localeKey(locale)];

  if (!deliveryDate) {
    return {
      label: labels.noDate,
      className: 'border-stone-200 bg-stone-50 text-stone-600'
    };
  }

  const days = daysUntil(deliveryDate);
  if (days < 0) {
    return {
      label: labels.past,
      className: 'border-red-200 bg-red-50 text-red-700'
    };
  }
  if (days === 0) {
    return {
      label: labels.today,
      className: 'border-rosewood/20 bg-white text-rosewood'
    };
  }
  if (days <= 2) {
    return {
      label: labels.inDay(days),
      className: 'border-amber-200 bg-amber-50 text-amber-800'
    };
  }

  return {
    label: labels.inDays(days),
    className: 'border-olive/20 bg-cream text-olive'
  };
}

export async function InquiryDeliveryBadge({ deliveryDate, locale }: { deliveryDate?: Date; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const state = deliveryState(deliveryDate, activeLocale);
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${state.className}`}>
      {state.label}
    </span>
  );
}
