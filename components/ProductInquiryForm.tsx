import type { Product } from '@/lib/catalog';
import { createInquiryAction } from '@/app/products/[slug]/actions';
import { INQUIRY_FIELD_LIMITS } from '@/lib/inquiries/validate-inquiry';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { formatStorefrontCopy } from '@/lib/localization/storefront-copy';

type ProductInquiryFormProps = {
  product: Product;
  dbReady: boolean;
  inquiry?: string;
  locale?: SupportedLocale;
};

type InquiryField = 'name' | 'phone' | 'email' | 'message' | 'database';

type InquiryMessageConfig = {
  tone: 'success' | 'warning';
  text: string;
  field?: InquiryField;
};

type InquiryMessageMap = Record<string, InquiryMessageConfig>;

const copy = {
  en: {
    eyebrow: 'Request this arrangement',
    title: 'Send an inquiry',
    body: 'Share your contact details and notes. The shop can follow up from the admin inbox.',
    name: 'Name',
    nameHelp: 'Use the name staff should ask for when they follow up.',
    phone: 'Phone',
    phoneHelp: 'Numbers, spaces, dashes, parentheses, and + are accepted.',
    emailOptional: 'Email optional',
    emailHelp: 'Leave blank if phone is the preferred contact method.',
    preferredDateOptional: 'Preferred date optional',
    message: 'Message',
    messageHelp: 'Include the occasion, size, color preference, or delivery timing.',
    deliveryNotesOptional: 'Delivery notes optional',
    submit: 'Send inquiry',
    messages: {
      sent: { tone: 'success', text: 'Inquiry sent. The shop will follow up soon.' },
      'database-required': { tone: 'warning', text: 'Inquiry storage requires DATABASE_URL. WhatsApp ordering is still available.', field: 'database' },
      'name-required': { tone: 'warning', text: 'Please enter your name.', field: 'name' },
      'name-too-long': { tone: 'warning', text: 'Please shorten your name before sending.', field: 'name' },
      'phone-invalid': { tone: 'warning', text: 'Please enter a valid phone number.', field: 'phone' },
      'phone-too-long': { tone: 'warning', text: 'Please shorten your phone number before sending.', field: 'phone' },
      'email-invalid': { tone: 'warning', text: 'Please enter a valid email address or leave it blank.', field: 'email' },
      'email-too-long': { tone: 'warning', text: 'Please shorten your email address before sending.', field: 'email' },
      'message-short': { tone: 'warning', text: 'Please include a message with at least 10 characters.', field: 'message' },
      'message-too-long': { tone: 'warning', text: 'Please shorten your message before sending.', field: 'message' },
      'delivery-notes-too-long': { tone: 'warning', text: 'Please shorten the delivery notes before sending.', field: 'message' }
    } satisfies InquiryMessageMap
  },
  fa: {
    eyebrow: 'درخواست این چیدمان',
    title: 'ارسال درخواست',
    body: 'اطلاعات تماس و توضیحات خود را وارد کنید تا فروشگاه از صندوق درخواست‌ها پیگیری کند.',
    name: 'نام',
    nameHelp: 'نامی را وارد کنید که تیم فروش هنگام پیگیری استفاده کند.',
    phone: 'تلفن',
    phoneHelp: 'عدد، فاصله، خط تیره، پرانتز و + پذیرفته می‌شود.',
    emailOptional: 'ایمیل اختیاری',
    emailHelp: 'اگر تلفن روش تماس ترجیحی است، این بخش را خالی بگذارید.',
    preferredDateOptional: 'تاریخ دلخواه اختیاری',
    message: 'پیام',
    messageHelp: 'مناسبت، اندازه، رنگ دلخواه یا زمان تحویل را بنویسید.',
    deliveryNotesOptional: 'توضیحات تحویل اختیاری',
    submit: 'ارسال درخواست',
    messages: {
      sent: { tone: 'success', text: 'درخواست ارسال شد. فروشگاه به‌زودی پیگیری می‌کند.' },
      'database-required': { tone: 'warning', text: 'ذخیره درخواست به DATABASE_URL نیاز دارد. سفارش واتساپی همچنان در دسترس است.', field: 'database' },
      'name-required': { tone: 'warning', text: 'لطفاً نام خود را وارد کنید.', field: 'name' },
      'name-too-long': { tone: 'warning', text: 'لطفاً نام را کوتاه‌تر وارد کنید.', field: 'name' },
      'phone-invalid': { tone: 'warning', text: 'لطفاً شماره تلفن معتبر وارد کنید.', field: 'phone' },
      'phone-too-long': { tone: 'warning', text: 'لطفاً شماره تلفن را کوتاه‌تر وارد کنید.', field: 'phone' },
      'email-invalid': { tone: 'warning', text: 'لطفاً ایمیل معتبر وارد کنید یا آن را خالی بگذارید.', field: 'email' },
      'email-too-long': { tone: 'warning', text: 'لطفاً ایمیل را کوتاه‌تر وارد کنید.', field: 'email' },
      'message-short': { tone: 'warning', text: 'لطفاً پیامی با حداقل ۱۰ نویسه وارد کنید.', field: 'message' },
      'message-too-long': { tone: 'warning', text: 'لطفاً پیام را کوتاه‌تر وارد کنید.', field: 'message' },
      'delivery-notes-too-long': { tone: 'warning', text: 'لطفاً توضیحات تحویل را کوتاه‌تر وارد کنید.', field: 'message' }
    } satisfies InquiryMessageMap
  }
} as const;

const baseInputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const errorInputClass = 'rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-stone-800 outline-none transition focus:border-amber-500 focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-stone-100';
const baseTextAreaClass = 'min-h-28 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const errorTextAreaClass = 'min-h-28 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-stone-800 outline-none transition focus:border-amber-500 focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-stone-100';

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function messageForInquiry(messages: InquiryMessageMap, inquiry?: string) {
  if (!inquiry) return undefined;
  return messages[inquiry];
}

function InquiryMessage({ message }: { message?: InquiryMessageConfig }) {
  if (!message) return null;
  const className =
    message.tone === 'success'
      ? 'mt-6 rounded-2xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive'
      : 'mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900';
  return <div className={className} role="status" aria-live="polite">{message.text}</div>;
}

function FieldError({ field, message }: { field: InquiryField; message?: InquiryMessageConfig }) {
  if (message?.field !== field || message.tone !== 'warning') return null;
  return <p className="text-xs font-semibold text-amber-800">{message.text}</p>;
}

function fieldHasError(field: InquiryField, message?: InquiryMessageConfig) {
  return message?.field === field && message.tone === 'warning';
}

export function ProductInquiryForm({ product, dbReady, inquiry, locale }: ProductInquiryFormProps) {
  const labels = copy[localeKey(locale)];
  const inquiryAction = createInquiryAction.bind(null, product.id, product.slug);
  const activeMessage = messageForInquiry(labels.messages, inquiry);
  const nameError = fieldHasError('name', activeMessage);
  const phoneError = fieldHasError('phone', activeMessage);
  const emailError = fieldHasError('email', activeMessage);
  const messageError = fieldHasError('message', activeMessage);

  return (
    <section className="mx-auto max-w-3xl px-5 pb-20">
      <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{labels.eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">{labels.title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{labels.body}</p>

        <InquiryMessage message={activeMessage} />

        <form action={inquiryAction} className="mt-6 grid gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              {labels.name}
              <input className={nameError ? errorInputClass : baseInputClass} name="name" required minLength={2} maxLength={INQUIRY_FIELD_LIMITS.name} aria-invalid={nameError} aria-describedby="inquiry-name-help" disabled={!dbReady} />
              <span id="inquiry-name-help" className="text-xs font-medium text-stone-500">{labels.nameHelp}</span>
              <FieldError field="name" message={activeMessage} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              {labels.phone}
              <input className={phoneError ? errorInputClass : baseInputClass} name="phone" required inputMode="tel" maxLength={INQUIRY_FIELD_LIMITS.phone} aria-invalid={phoneError} aria-describedby="inquiry-phone-help" disabled={!dbReady} />
              <span id="inquiry-phone-help" className="text-xs font-medium text-stone-500">{labels.phoneHelp}</span>
              <FieldError field="phone" message={activeMessage} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              {labels.emailOptional}
              <input className={emailError ? errorInputClass : baseInputClass} name="email" type="email" maxLength={INQUIRY_FIELD_LIMITS.email} aria-invalid={emailError} aria-describedby="inquiry-email-help" disabled={!dbReady} />
              <span id="inquiry-email-help" className="text-xs font-medium text-stone-500">{labels.emailHelp}</span>
              <FieldError field="email" message={activeMessage} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              {labels.preferredDateOptional}
              <input className={baseInputClass} name="deliveryDate" type="date" disabled={!dbReady} />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            {labels.message}
            <textarea className={messageError ? errorTextAreaClass : baseTextAreaClass} name="message" required minLength={10} maxLength={INQUIRY_FIELD_LIMITS.message} aria-invalid={messageError} aria-describedby="inquiry-message-help" disabled={!dbReady} defaultValue={formatStorefrontCopy('product.interestedMessage', locale, { title: product.title })} />
            <span id="inquiry-message-help" className="text-xs font-medium text-stone-500">{labels.messageHelp}</span>
            <FieldError field="message" message={activeMessage} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            {labels.deliveryNotesOptional}
            <textarea className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100" name="deliveryNotes" maxLength={INQUIRY_FIELD_LIMITS.deliveryNotes} disabled={!dbReady} />
          </label>
          <button className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!dbReady}>{labels.submit}</button>
        </form>
      </div>
    </section>
  );
}
