import type { CustomerInquiry } from '@/lib/catalog';

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

export function InquiryContactActions({ inquiry }: { inquiry: CustomerInquiry }) {
  const phone = normalizedPhone(inquiry.phone);
  const subject = `Golara inquiry${inquiry.productTitle ? `: ${inquiry.productTitle}` : ''}`;
  const whatsapp = whatsappHref(inquiry.phone, subject);
  const email = mailHref(inquiry.email, subject);

  if (!phone && !email && !whatsapp) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {phone ? (
        <a className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood transition hover:bg-cream" href={`tel:${phone}`}>
          Call
        </a>
      ) : null}
      {whatsapp ? (
        <a className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 transition hover:bg-white" href={whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      ) : null}
      {email ? (
        <a className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-800 transition hover:bg-white" href={email}>
          Email
        </a>
      ) : null}
    </div>
  );
}
