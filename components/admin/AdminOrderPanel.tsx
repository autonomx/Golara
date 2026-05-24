import Link from 'next/link';
import { updateOrderStatusAction } from '@/app/admin/order-actions';
import type { CheckoutOrderSummary } from '@/lib/catalog';
import { formatMinorUnitAmount } from '@/lib/catalog';

const orderStatuses = ['draft', 'pending_payment', 'paid', 'preparing', 'out_for_delivery', 'fulfilled', 'cancelled'];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function OrderStatusForm({ order }: { order: CheckoutOrderSummary }) {
  const updateAction = updateOrderStatusAction.bind(null, order.id);

  return (
    <form action={updateAction} className="mt-3 grid gap-2 rounded-2xl border border-rosewood/10 bg-cream p-3">
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/60">
        Update status
        <select name="status" defaultValue={order.status} className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800">
          {orderStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/60">
        Staff note optional
        <input name="staffNotes" className="rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800" placeholder="Internal note" />
      </label>
      <button className="rounded-full bg-rosewood px-4 py-2 text-xs font-semibold text-white" type="submit">Save order</button>
    </form>
  );
}

export function AdminOrderPanel({ orders }: { orders: CheckoutOrderSummary[] }) {
  return (
    <section id="orders" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Orders</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Checkout order operations</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Review recent checkout orders, open order details, update operational status, and keep staff-only notes.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-rosewood/10 bg-cream p-5 text-sm text-stone-700">
          No checkout orders found yet. New cart/order draft flows will appear here after they are created.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rosewood/10">
          <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold text-rosewood underline decoration-rosewood/30 underline-offset-4 hover:decoration-rosewood">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-stone-500">{order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {order.checkoutMode}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-semibold text-stone-700">{order.customerName || 'Guest / draft'}</p>
                    {order.customerPhone ? <p className="text-xs text-stone-500">{order.customerPhone}</p> : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="rounded-full border border-rosewood/15 bg-cream px-3 py-1 text-xs font-semibold text-rosewood">
                      {order.status}
                    </span>
                    {order.latestPaymentStatus ? <p className="mt-1 text-xs text-stone-500">Payment: {order.latestPaymentStatus}</p> : null}
                    <OrderStatusForm order={order} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-rosewood">
                    {formatMinorUnitAmount(order.totalCents, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
