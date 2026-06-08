import type { CustomerInquiry } from '@/lib/catalog';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    subjectPrefix: 'Golara inquiry',
    call: 'Call',
    whatsapp: 'WhatsApp',
    email: 'Email'
  },
  fa: {
    subjectPrefix: 'درخواست Golara',
    call: 'تماس',
    whatsapp: 'WhatsApp',
    email: 'ایمیل'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function normalizedPhone(phone?: string) {
  const digits = phone?.replace(/[^+\d]/g, '') ?? '';
  return digits || undefined;
}

function whatsappHref(phone?: string, message?: string) {
  const digits = normalizedPhone(phone)?.replace(/^\+/, '');
  if (!digits) return undefined;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

function mailHref(email?: string, subject?: string) {
  if (!email) return undefined;
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${email}${params}`;
}

export async function InquiryContactActions({ inquiry, locale }: { inquiry: CustomerInquiry; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const labels = copy[localeKey(activeLocale)];
  const phone = normalizedPhone(inquiry.phone);
  const subject = `${labels.subjectPrefix}${inquiry.productTitle ? `: ${inquiry.productTitle}` : ''}`;
  const whatsapp = whatsappHref(inquiry.phone, subject);
  const email = mailHref(inquiry.email, subject);

  if (!phone && !email && !whatsapp) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {phone ? (
        <a className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood transition hover:bg-cream" href={`tel:${phone}`}>
          {labels.call}
        </a>
      ) : null}
      {whatsapp ? (
        <a className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 transition hover:bg-white" href={whatsapp} target="_blank" rel="noreferrer">
          {labels.whatsapp}
        </a>
      ) : null}
      {email ? (
        <a className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-800 transition hover:bg-white" href={email}>
          {labels.email}
        </a>
      ) : null}
    </div>
  );
}
