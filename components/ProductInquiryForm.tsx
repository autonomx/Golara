import type { Product } from '@/lib/catalog';
import { createInquiryAction } from '@/app/products/[slug]/actions';

type ProductInquiryFormProps = {
  product: Product;
  dbReady: boolean;
  inquiry?: string;
};

type InquiryField = 'name' | 'phone' | 'email' | 'message' | 'database';

type InquiryMessageConfig = {
  tone: 'success' | 'warning';
  text: string;
  field?: InquiryField;
};

const inquiryMessages: Record<string, InquiryMessageConfig> = {
  sent: { tone: 'success', text: 'Inquiry sent. The shop will follow up soon.' },
  'database-required': { tone: 'warning', text: 'Inquiry storage requires DATABASE_URL. WhatsApp ordering is still available.', field: 'database' },
  'name-required': { tone: 'warning', text: 'Please enter your name.', field: 'name' },
  'phone-invalid': { tone: 'warning', text: 'Please enter a valid phone number.', field: 'phone' },
  'email-invalid': { tone: 'warning', text: 'Please enter a valid email address or leave it blank.', field: 'email' },
  'message-short': { tone: 'warning', text: 'Please include a message with at least 10 characters.', field: 'message' }
};

const baseInputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const errorInputClass = 'rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-stone-800 outline-none transition focus:border-amber-500 focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-stone-100';
const baseTextAreaClass = 'min-h-28 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const errorTextAreaClass = 'min-h-28 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-3 text-stone-800 outline-none transition focus:border-amber-500 focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:bg-stone-100';

function messageForInquiry(inquiry?: string) {
  if (!inquiry) return undefined;
  return inquiryMessages[inquiry];
}

function InquiryMessage({ inquiry }: { inquiry?: string }) {
  const message = messageForInquiry(inquiry);
  if (!message) return null;
  const className =
    message.tone === 'success'
      ? 'mt-6 rounded-2xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive'
      : 'mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900';
  return <div className={className}>{message.text}</div>;
}

function FieldError({ field, message }: { field: InquiryField; message?: InquiryMessageConfig }) {
  if (message?.field !== field || message.tone !== 'warning') return null;
  return <p className="text-xs font-semibold text-amber-800">{message.text}</p>;
}

function fieldHasError(field: InquiryField, message?: InquiryMessageConfig) {
  return message?.field === field && message.tone === 'warning';
}

export function ProductInquiryForm({ product, dbReady, inquiry }: ProductInquiryFormProps) {
  const inquiryAction = createInquiryAction.bind(null, product.id, product.slug);
  const activeMessage = messageForInquiry(inquiry);
  const nameError = fieldHasError('name', activeMessage);
  const phoneError = fieldHasError('phone', activeMessage);
  const emailError = fieldHasError('email', activeMessage);
  const messageError = fieldHasError('message', activeMessage);

  return (
    <section className="mx-auto max-w-3xl px-5 pb-20">
      <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Request this arrangement</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Send an inquiry</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">Share your contact details and notes. The shop can follow up from the admin inbox.</p>

        <InquiryMessage inquiry={inquiry} />

        <form action={inquiryAction} className="mt-6 grid gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              Name
              <input className={nameError ? errorInputClass : baseInputClass} name="name" required minLength={2} aria-invalid={nameError} aria-describedby="inquiry-name-help" disabled={!dbReady} />
              <span id="inquiry-name-help" className="text-xs font-medium text-stone-500">Use the name staff should ask for when they follow up.</span>
              <FieldError field="name" message={activeMessage} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              Phone
              <input className={phoneError ? errorInputClass : baseInputClass} name="phone" required inputMode="tel" aria-invalid={phoneError} aria-describedby="inquiry-phone-help" disabled={!dbReady} />
              <span id="inquiry-phone-help" className="text-xs font-medium text-stone-500">Numbers, spaces, dashes, parentheses, and + are accepted.</span>
              <FieldError field="phone" message={activeMessage} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              Email optional
              <input className={emailError ? errorInputClass : baseInputClass} name="email" type="email" aria-invalid={emailError} aria-describedby="inquiry-email-help" disabled={!dbReady} />
              <span id="inquiry-email-help" className="text-xs font-medium text-stone-500">Leave blank if phone is the preferred contact method.</span>
              <FieldError field="email" message={activeMessage} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">
              Preferred date optional
              <input className={baseInputClass} name="deliveryDate" type="date" disabled={!dbReady} />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            Message
            <textarea className={messageError ? errorTextAreaClass : baseTextAreaClass} name="message" required minLength={10} aria-invalid={messageError} aria-describedby="inquiry-message-help" disabled={!dbReady} defaultValue={`I am interested in ${product.title}.`} />
            <span id="inquiry-message-help" className="text-xs font-medium text-stone-500">Include the occasion, size, color preference, or delivery timing.</span>
            <FieldError field="message" message={activeMessage} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            Delivery notes optional
            <textarea className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100" name="deliveryNotes" disabled={!dbReady} />
          </label>
          <button className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!dbReady}>Send inquiry</button>
        </form>
      </div>
    </section>
  );
}
