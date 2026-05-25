import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addOrderTimelineNoteAction, updateOrderFulfillmentAction } from '@/app/admin/order-actions';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getAdminCheckoutOrder } from '@/lib/checkout/admin-order-repository';

export const dynamic = 'force-dynamic';

const fulfillmentStatuses = ['not_scheduled', 'scheduled', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'issue'];
const paymentMetadataKeys = ['verified', 'verificationSkipped', 'reason', 'providerCode', 'authority', 'refId', 'httpStatus', 'fee', 'feeType', 'instruction'];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function metadataRecord(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value).filter((entry): entry is [string, string | number | boolean] => {
    const item = entry[1];
    return typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean';
  });
  return Object.fromEntries(entries);
}

function compactValue(value: string | number | boolean) {
  if (typeof value !== 'string') return String(value);
  return value.length > 80 ? `${value.slice(0, 77)}...` : value;
}

function paymentTone(status: string, metadata: Record<string, string | number | boolean>) {
  if (status === 'verified_paid' || metadata.verified === true) return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'failed' || metadata.verified === false) return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'cancelled') return 'border-amber-300 bg-amber-50 text-amber-900';
  if (status === 'redirect_required') return 'border-blue-200 bg-blue-50 text-blue-900';
  return 'border-rosewood/10 bg-cream text-stone-700';
}

function verificationLabel(status: string, metadata: Record<string, string | number | boolean>) {
  if (status === 'verified_paid' || metadata.verified === true) return 'Verified paid';
  if (metadata.verified === false) return `Verification failed${metadata.reason ? `: ${metadata.reason}` : ''}`;
  if (metadata.verificationSkipped === true) return `Verification skipped${metadata.reason ? `: ${metadata.reason}` : ''}`;
  if (status === 'redirect_required') return 'Customer redirected to gateway';
  if (status === 'manual_pending') return 'Manual staff follow-up required';
  return status;
}

function PaymentAttemptCard({ attempt }: { attempt: Awaited<ReturnType<typeof getAdminCheckoutOrder>>['paymentAttempts'][number] }) {
  const metadata = metadataRecord(attempt.metadata);
  const visibleMetadata = paymentMetadataKeys
    .filter((key) => metadata[key] !== undefined && metadata[key] !== '')
    .map((key) => [key, metadata[key]] as const);
  const hasRedirect = Boolean(attempt.redirectUrl);

  return (
    <article className={`rounded-3xl border p-4 text-sm ${paymentTone(attempt.status, metadata)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{attempt.provider} · {attempt.status}</p>
          <p className="mt-1 text-xs opacity-80">{verificationLabel(attempt.status, metadata)}</p>
        </div>
        <time className="text-xs opacity-70">{formatDate(attempt.createdAt)}</time>
      </div>
      <div className="mt-3 grid gap-1 text-xs">
        <p><strong>Amount:</strong> {formatMinorUnitAmount(attempt.amountCents, attempt.currency)}</p>
        {attempt.providerReference ? <p className="break-all"><strong>Reference:</strong> {attempt.providerReference}</p> : null}
        {hasRedirect ? <p className="break-all"><strong>Redirect:</strong> configured</p> : null}
      </div>
      {visibleMetadata.length > 0 ? (
        <dl className="mt-3 grid gap-2 rounded-2xl border border-current/10 bg-white/50 p-3 text-xs">
          {visibleMetadata.map(([key, value]) => (
            <div key={key} className="grid gap-1">
              <dt className="font-semibold uppercase tracking-[0.14em] opacity-70">{key}</dt>
              <dd className="break-all">{compactValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

function StatusBanner({ status }: { status?: string }) {
  if (status === 'order-note-added') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Staff note added to the order timeline.</div>;
  }
  if (status === 'fulfillment-updated') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Fulfillment details updated.</div>;
  }
  return null;
}

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const [{ orderId }, { status }] = await Promise.all([params, searchParams]);
  const order = await getAdminCheckoutOrder(orderId);
  if (!order) notFound();
  const noteAction = addOrderTimelineNoteAction.bind(null, order.id);
  const fulfillmentAction = updateOrderFulfillmentAction.bind(null, order.id);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <StatusBanner status={status} />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin order</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">{order.orderNumber}</h1>
            <p className="mt-4 text-stone-600">Created {formatDate(order.createdAt)} · {order.checkoutMode} · {order.status} · {order.fulfillmentStatus}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/orders/${order.id}/packing-slip`} className="rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">
              Packing slip
            </Link>
            <Link href="/admin#orders" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">
              Back to orders
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Line items</h2>
              <div className="mt-5 overflow-hidden rounded-3xl border border-rosewood/10">
                <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
                  <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60">
                    <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Line total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3"><p className="font-semibold text-rosewood">{item.productTitle}</p><p className="text-xs text-stone-500">{item.productCode}</p></td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{formatMinorUnitAmount(item.unitPriceCents, order.currency)}</td>
                        <td className="px-4 py-3 font-semibold text-rosewood">{formatMinorUnitAmount(item.lineTotalCents, order.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-stone-700 sm:max-w-sm sm:ml-auto">
                <div className="flex justify-between"><span>Subtotal</span><strong>{formatMinorUnitAmount(order.subtotalCents, order.currency)}</strong></div>
                <div className="flex justify-between"><span>Delivery</span><strong>{formatMinorUnitAmount(order.deliveryCents, order.currency)}</strong></div>
                <div className="flex justify-between"><span>Discount</span><strong>{formatMinorUnitAmount(order.discountCents, order.currency)}</strong></div>
                <div className="flex justify-between border-t border-rosewood/10 pt-2 text-lg text-rosewood"><span>Total</span><strong>{formatMinorUnitAmount(order.totalCents, order.currency)}</strong></div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="font-display text-3xl text-rosewood">Timeline</h2><p className="mt-2 text-sm text-stone-600">Add internal notes and review order history.</p></div>
                <form action={noteAction} className="grid w-full gap-2 rounded-3xl border border-rosewood/10 bg-cream p-4 md:max-w-md">
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">Staff timeline note<textarea name="note" minLength={2} required className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-sm text-stone-800 outline-none focus:border-rosewood" /></label>
                  <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Add note</button>
                </form>
              </div>
              {order.timelineEvents.length === 0 ? <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-5 text-sm text-stone-700">No timeline events yet.</p> : (
                <div className="mt-5 grid gap-3">{order.timelineEvents.map((event) => (
                  <article key={event.id} className="rounded-3xl border border-rosewood/10 bg-cream p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-rosewood">{event.title}</p><p className="text-xs text-stone-500">{event.type} · {event.actorLabel || 'System'} {event.actorRole ? `· ${event.actorRole}` : ''}</p></div><time className="text-xs text-stone-500">{formatDate(event.createdAt)}</time></div>{event.note ? <p className="mt-2 text-sm text-stone-700">{event.note}</p> : null}</article>
                ))}</div>
              )}
            </section>
          </div>

          <aside className="grid content-start gap-6">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Fulfillment</h2>
              <div className="mt-4 grid gap-2 text-sm text-stone-700">
                <p><strong>Status:</strong> {order.fulfillmentStatus}</p>
                <p><strong>Courier:</strong> {order.courierName || 'Not set'}</p>
                <p><strong>Courier phone:</strong> {order.courierPhone || 'Not set'}</p>
                <p><strong>Note:</strong> {order.fulfillmentNote || 'None'}</p>
              </div>
              <form action={fulfillmentAction} className="mt-5 grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Fulfillment status<select name="fulfillmentStatus" defaultValue={order.fulfillmentStatus} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800">{fulfillmentStatuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Courier name<input name="courierName" defaultValue={order.courierName || ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800" /></label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Courier phone<input name="courierPhone" defaultValue={order.courierPhone || ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800" /></label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Fulfillment note<textarea name="fulfillmentNote" defaultValue={order.fulfillmentNote || ''} className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800" /></label>
                <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Save fulfillment</button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm"><h2 className="font-display text-3xl text-rosewood">Customer</h2><div className="mt-4 grid gap-2 text-sm text-stone-700"><p><strong>Name:</strong> {order.customer?.displayName || order.recipientName || 'Guest / draft'}</p><p><strong>Phone:</strong> {order.customer?.phone || order.recipientPhone || 'Not set'}</p><p><strong>Email:</strong> {order.customer?.email || 'Not set'}</p><p><strong>Locale:</strong> {order.customer?.locale || 'Not set'}</p></div></section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm"><h2 className="font-display text-3xl text-rosewood">Delivery</h2><div className="mt-4 grid gap-2 text-sm text-stone-700"><p><strong>Date:</strong> {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not set'}</p><p><strong>Window:</strong> {order.deliveryWindow || 'Not set'}</p><p><strong>Address:</strong> {order.address ? `${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ''}` : 'Not set'}</p><p><strong>City:</strong> {order.address?.city || 'Not set'}</p><p><strong>Notes:</strong> {order.address?.notes || order.customerNote || 'None'}</p></div></section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Payment diagnostics</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Provider status, verification outcome, and safe metadata summaries for staff review.</p>
              {order.paymentAttempts.length === 0 ? (
                <p className="mt-4 text-sm text-stone-700">No payment attempts yet.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {order.paymentAttempts.map((attempt) => <PaymentAttemptCard key={attempt.id} attempt={attempt} />)}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
