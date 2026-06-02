import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addOrderLineItemAction, addOrderTimelineNoteAction, markOrderManualPaymentAction, refundManualPaymentAttemptAction, removeOrderLineItemAction, updateOrderCustomerAssignmentAction, updateOrderDiscountAction, updateOrderFulfillmentAction, updateOrderLineItemQuantityAction, voidManualPaymentAttemptAction } from '@/app/admin/order-actions';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listAdminOrderCustomerAssignmentOptions } from '@/lib/checkout/admin-order-assignment-repository';
import { isAdminOrderLineEditable, listAdminOrderLineProductOptions } from '@/lib/checkout/admin-order-line-repository';
import { getAdminCheckoutOrder } from '@/lib/checkout/admin-order-repository';
import { CHECKOUT_FULFILLMENT_STATUSES } from '@/lib/checkout/checkout-state-machine';

export const dynamic = 'force-dynamic';

type AdminCheckoutOrder = NonNullable<Awaited<ReturnType<typeof getAdminCheckoutOrder>>>;
type AdminPaymentAttempt = AdminCheckoutOrder['paymentAttempts'][number];
type AdminOrderItem = AdminCheckoutOrder['items'][number];

const fulfillmentStatuses = [...CHECKOUT_FULFILLMENT_STATUSES];
const paymentMetadataKeys = ['verified', 'verificationSkipped', 'reason', 'providerCode', 'authority', 'refId', 'httpStatus', 'fee', 'feeType', 'instruction'];
const lineEditInputClass = 'rounded-2xl border border-rosewood/15 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-rosewood';

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
  if (status === 'paid' || metadata.verified === true) return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'failed' || metadata.verified === false) return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'cancelled') return 'border-amber-300 bg-amber-50 text-amber-900';
  if (status === 'pending') return 'border-blue-200 bg-blue-50 text-blue-900';
  return 'border-rosewood/10 bg-cream text-stone-700';
}

function verificationLabel(status: string, metadata: Record<string, string | number | boolean>) {
  if (status === 'paid' || metadata.verified === true) return 'Verified paid';
  if (metadata.verified === false) return `Verification failed${metadata.reason ? `: ${metadata.reason}` : ''}`;
  if (metadata.verificationSkipped === true) return `Verification skipped${metadata.reason ? `: ${metadata.reason}` : ''}`;
  if (status === 'pending') return 'Payment pending';
  if (status === 'created') return 'Payment created';
  return status;
}

function reservationTone(status: string) {
  if (status === 'held') return 'border-blue-200 bg-blue-50 text-blue-900';
  if (status === 'committed') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (status === 'released') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-rosewood/10 bg-cream text-stone-700';
}

function FulfillmentInventoryCard({ items }: { items: AdminOrderItem[] }) {
  const reservations = items.flatMap((item) => item.stockReservations.map((reservation) => ({ item, reservation })));
  const held = reservations.filter(({ reservation }) => reservation.status === 'held').reduce((sum, entry) => sum + entry.reservation.quantity, 0);
  const committed = reservations.filter(({ reservation }) => reservation.status === 'committed').reduce((sum, entry) => sum + entry.reservation.quantity, 0);
  const released = reservations.filter(({ reservation }) => reservation.status === 'released').reduce((sum, entry) => sum + entry.reservation.quantity, 0);

  return (
    <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <h2 className="font-display text-3xl text-rosewood">Inventory reservations</h2>
      <div className="mt-4 grid gap-2 text-sm text-stone-700">
        <p><strong>Held:</strong> {held}</p>
        <p><strong>Committed:</strong> {committed}</p>
        <p><strong>Released:</strong> {released}</p>
      </div>
      {reservations.length === 0 ? (
        <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">No SKU-level stock reservations are attached to this order.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {reservations.map(({ item, reservation }) => (
            <article key={reservation.id} className={`rounded-3xl border p-4 text-sm ${reservationTone(reservation.status)}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.variantSku || item.productCode} / {item.variantName || item.productTitle}</p>
                  <p className="mt-1 text-xs opacity-80">{reservation.variantStock.location.name} / {reservation.variantStock.location.slug}</p>
                </div>
                <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold">{reservation.status}</span>
              </div>
              <div className="mt-3 grid gap-1 text-xs">
                <p><strong>Reserved:</strong> {reservation.quantity}</p>
                <p><strong>Location available now:</strong> {Math.max(0, reservation.variantStock.quantity - reservation.variantStock.reservedQuantity)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentAttemptCard({ orderId, attempt }: { orderId: string; attempt: AdminPaymentAttempt }) {
  const metadata = metadataRecord(attempt.metadata);
  const visibleMetadata = paymentMetadataKeys
    .filter((key) => metadata[key] !== undefined && metadata[key] !== '')
    .map((key) => [key, metadata[key]] as const);
  const hasRedirect = Boolean(attempt.redirectUrl);
  const canRefund = attempt.provider === 'manual' && attempt.status === 'paid';
  const canVoid = attempt.provider === 'manual' && (attempt.status === 'created' || attempt.status === 'pending');

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
        {attempt.providerReference ? <p className="break-all"><strong>Provider reference:</strong> {attempt.providerReference}</p> : null}
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
      {attempt.events.length > 0 ? (
        <div className="mt-3 grid gap-2 rounded-2xl border border-current/10 bg-white/50 p-3 text-xs">
          <p className="font-semibold uppercase tracking-[0.14em] opacity-70">Payment events</p>
          {attempt.events.map((event) => (
            <article key={event.id} className="grid gap-1 border-t border-current/10 pt-2 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">{event.eventType}{event.status ? ` / ${event.status}` : ''}</p>
                <time className="opacity-70">{formatDate(event.createdAt)}</time>
              </div>
              <p className="break-all opacity-80">{event.provider} / {event.idempotencyKey}</p>
              {event.processedAt ? <p className="opacity-80">Processed {formatDate(event.processedAt)}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
      {canRefund || canVoid ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canRefund ? (
            <form action={refundManualPaymentAttemptAction.bind(null, orderId, attempt.id)}>
              <button type="submit" className="rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-900">Refund manual payment</button>
            </form>
          ) : null}
          {canVoid ? (
            <form action={voidManualPaymentAttemptAction.bind(null, orderId, attempt.id)}>
              <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">Void manual payment</button>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function StatusBanner({ status }: { status?: string }) {
  if (status === 'staff-draft-created') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Staff draft order created.</div>;
  }
  if (status === 'order-line-added') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Line item added.</div>;
  }
  if (status === 'order-line-updated') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Line item updated.</div>;
  }
  if (status === 'order-line-removed') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Line item removed.</div>;
  }
  if (status === 'order-customer-assigned') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Customer assignment updated.</div>;
  }
  if (status === 'order-discount-updated') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Order discount updated.</div>;
  }
  if (status === 'manual-payment-marked') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Manual payment marked paid.</div>;
  }
  if (status === 'manual-payment-refunded') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Manual payment refunded.</div>;
  }
  if (status === 'manual-payment-voided') {
    return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">Manual payment voided.</div>;
  }
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
  const canEditLineItems = isAdminOrderLineEditable(order.status);
  const lineOptions = canEditLineItems ? await listAdminOrderLineProductOptions() : [];
  const customerAssignmentOptions = canEditLineItems ? await listAdminOrderCustomerAssignmentOptions() : [];
  const addLineAction = addOrderLineItemAction.bind(null, order.id);
  const assignCustomerAction = updateOrderCustomerAssignmentAction.bind(null, order.id);
  const discountAction = updateOrderDiscountAction.bind(null, order.id);
  const manualPaymentAction = markOrderManualPaymentAction.bind(null, order.id);
  const noteAction = addOrderTimelineNoteAction.bind(null, order.id);
  const fulfillmentAction = updateOrderFulfillmentAction.bind(null, order.id);
  const lineItemColumnCount = canEditLineItems ? 5 : 4;
  const latestPaymentStatus = order.paymentAttempts[0]?.status;
  const canMarkManualPayment = order.status !== 'cancelled' && latestPaymentStatus !== 'paid';

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
              {canEditLineItems ? (
                <form action={addLineAction} className="mt-5 grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4 md:grid-cols-[1fr_7rem_auto]">
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Product
                    <select name="lineOption" required className={lineEditInputClass}>
                      <option value="">Select product</option>
                      {lineOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Qty
                    <input name="quantity" type="number" min={1} max={99} defaultValue={1} className={lineEditInputClass} />
                  </label>
                  <div className="flex items-end">
                    <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Add line</button>
                  </div>
                </form>
              ) : null}
              <div className="mt-5 overflow-hidden rounded-3xl border border-rosewood/10">
                <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
                  <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60">
                    <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Line total</th>{canEditLineItems ? <th className="px-4 py-3">Edit</th> : null}</tr>
                  </thead>
                  <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
                    {order.items.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-sm text-stone-600" colSpan={lineItemColumnCount}>No line items yet.</td>
                      </tr>
                    ) : order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3"><p className="font-semibold text-rosewood">{item.productTitle}</p><p className="text-xs text-stone-500">{item.productCode}{item.variantSku ? ` / ${item.variantSku}` : ''}</p>{item.variantName ? <p className="mt-1 text-xs font-semibold text-rosewood">{item.variantName}</p> : null}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{formatMinorUnitAmount(item.unitPriceCents, order.currency)}</td>
                        <td className="px-4 py-3 font-semibold text-rosewood">{formatMinorUnitAmount(item.lineTotalCents, order.currency)}</td>
                        {canEditLineItems ? (
                          <td className="px-4 py-3">
                            <div className="grid gap-2">
                              <form action={updateOrderLineItemQuantityAction.bind(null, order.id, item.id)} className="flex flex-wrap items-center gap-2">
                                <input name="quantity" type="number" min={1} max={99} defaultValue={item.quantity} className={`${lineEditInputClass} w-20`} />
                                <button type="submit" className="rounded-full border border-rosewood/20 px-4 py-2 text-xs font-semibold text-rosewood">Update</button>
                              </form>
                              <form action={removeOrderLineItemAction.bind(null, order.id, item.id)}>
                                <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700">Remove</button>
                              </form>
                            </div>
                          </td>
                        ) : null}
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
              {canEditLineItems ? (
                <form action={discountAction} className="mt-5 grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4 sm:ml-auto sm:max-w-sm">
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Discount
                    <input name="discountCents" type="number" min={0} defaultValue={order.discountCents} className={lineEditInputClass} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Note
                    <input name="discountNote" className={lineEditInputClass} placeholder="Reason" />
                  </label>
                  <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Save discount</button>
                </form>
              ) : null}
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

            <FulfillmentInventoryCard items={order.items} />

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Customer</h2>
              <div className="mt-4 grid gap-2 text-sm text-stone-700">
                <p><strong>Name:</strong> {order.customer?.displayName || order.recipientName || 'Guest / draft'}</p>
                <p><strong>Phone:</strong> {order.customer?.phone || order.recipientPhone || 'Not set'}</p>
                <p><strong>Email:</strong> {order.customer?.email || 'Not set'}</p>
                {order.address ? <p><strong>Address:</strong> {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p> : null}
                <p><strong>Delivery:</strong> {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not scheduled'} {order.deliveryWindow ? `· ${order.deliveryWindow}` : ''}</p>
                {order.customerNote ? <p><strong>Customer note:</strong> {order.customerNote}</p> : null}
              </div>
              {canEditLineItems ? (
                <form action={assignCustomerAction} className="mt-5 grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Customer
                    <select name="customerId" defaultValue={order.customerId ?? ''} className={lineEditInputClass}>
                      <option value="">Guest / draft</option>
                      {customerAssignmentOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.label} / {customer.phone}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Address
                    <select name="addressId" defaultValue={order.addressId ?? ''} className={lineEditInputClass}>
                      <option value="">No saved address</option>
                      {customerAssignmentOptions.map((customer) => (
                        <optgroup key={customer.id} label={customer.label}>
                          {customer.addresses.map((address) => <option key={address.id} value={address.id}>{address.label}{address.isDefault ? ' / Default' : ''} / {address.summary}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Save customer</button>
                </form>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Payments</h2>
              {canMarkManualPayment ? (
                <form action={manualPaymentAction} className="mt-5 grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Amount
                    <input name="amountCents" type="number" min={0} defaultValue={order.totalCents} className={lineEditInputClass} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Reference
                    <input name="providerReference" className={lineEditInputClass} placeholder="Receipt or transfer ID" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Note
                    <textarea name="note" className={`${lineEditInputClass} min-h-20`} />
                  </label>
                  <button type="submit" className="rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white">Mark manual payment paid</button>
                </form>
              ) : null}
              {order.paymentAttempts.length === 0 ? <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">No payment attempts yet.</p> : <div className="mt-4 grid gap-3">{order.paymentAttempts.map((attempt) => <PaymentAttemptCard key={attempt.id} orderId={order.id} attempt={attempt} />)}</div>}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
