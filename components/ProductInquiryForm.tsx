import type { Product } from '@/lib/catalog';
import { createInquiryAction } from '@/app/products/[slug]/actions';

type ProductInquiryFormProps = {
  product: Product;
  dbReady: boolean;
  inquiry?: string;
};

export function ProductInquiryForm({ product, dbReady, inquiry }: ProductInquiryFormProps) {
  const inquiryAction = createInquiryAction.bind(null, product.id, product.slug);

  return (
    <section className="mx-auto max-w-3xl px-5 pb-20">
      <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Request this arrangement</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Send an inquiry</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">Share your contact details and notes. The shop can follow up from the admin inbox.</p>

        {inquiry === 'sent' ? (
          <div className="mt-6 rounded-2xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Inquiry sent. The shop will follow up soon.</div>
        ) : null}

        {inquiry === 'database-required' ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Inquiry storage requires DATABASE_URL. WhatsApp ordering is still available.</div>
        ) : null}

        <form action={inquiryAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Name<input className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100" name="name" required disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Phone<input className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100" name="phone" required disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Email optional<input className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100" name="email" type="email" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Preferred date optional<input className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100" name="deliveryDate" type="date" disabled={!dbReady} /></label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Message<textarea className="min-h-28 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100" name="message" required disabled={!dbReady} defaultValue={`I am interested in ${product.title}.`} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Delivery notes optional<textarea className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100" name="deliveryNotes" disabled={!dbReady} /></label>
          <button className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!dbReady}>Send inquiry</button>
        </form>
      </div>
    </section>
  );
}
