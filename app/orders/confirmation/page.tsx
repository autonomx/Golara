import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { orderConfirmationPanelClass, orderConfirmationResultCopy } from '@/lib/checkout/order-confirmation-copy';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ order?: string; result?: string }> }) {
  const { order, result } = await searchParams;
  const orderNumber = order?.trim();
  const copy = orderConfirmationResultCopy(result);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-20">
        <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 text-center shadow-sm">
          <div className={`rounded-3xl border p-5 ${orderConfirmationPanelClass(copy.tone)}`} role="status" aria-live="polite">
            <p className="text-sm font-semibold uppercase tracking-[0.25em]">{copy.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl">{copy.title}</h1>
            <p className="mt-5 text-lg leading-8">{copy.body}</p>
          </div>
          {orderNumber ? (
            <div className="mt-6 rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Reference</p>
              <p className="mt-2 font-display text-3xl text-rosewood">{orderNumber}</p>
            </div>
          ) : null}
          <p className="mt-5 text-sm leading-6 text-stone-600">
            For privacy, this public confirmation page does not show address, customer, or payment details. Keep the reference number for staff follow-up.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">
              Continue shopping
            </Link>
            <Link href="/" className="rounded-full border border-rosewood/15 bg-white px-6 py-3 text-sm font-semibold text-rosewood">
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
