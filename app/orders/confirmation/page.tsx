import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const orderNumber = order?.trim();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-5 py-20">
        <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Order draft created</p>
          <h1 className="mt-3 font-display text-5xl text-rosewood">Thank you</h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">
            Your order draft has been sent to the shop. Staff will review availability and follow up with the next step.
          </p>
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
