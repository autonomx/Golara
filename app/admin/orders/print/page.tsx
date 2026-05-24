import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listAdminCheckoutOrdersForExport } from '@/lib/checkout/admin-order-repository';

export const dynamic = 'force-dynamic';

function optionalParam(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export default async function AdminOrderPrintPage({ searchParams }: { searchParams: Promise<{ orderStatus?: string; orderPaymentStatus?: string; orderSearch?: string }> }) {
  await assertAdminRole('staff');
  const { orderStatus, orderPaymentStatus, orderSearch } = await searchParams;
  const orders = await listAdminCheckoutOrdersForExport({
    status: optionalParam(orderStatus),
    paymentStatus: optionalParam(orderPaymentStatus),
    search: optionalParam(orderSearch)
  });

  return (
    <main className="mx-auto max-w-6xl bg-white p-8 text-stone-900">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Golara admin</p>
        <h1 className="mt-2 font-display text-5xl text-rosewood">Order list</h1>
        <p className="mt-2 text-sm text-stone-600">Generated {formatDate(new Date())}</p>
      </header>

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-stone-300">
            <th className="py-2 pr-3">Created</th>
            <th className="py-2 pr-3">Order</th>
            <th className="py-2 pr-3">Customer</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-stone-200">
              <td className="py-2 pr-3 align-top">{formatDate(order.createdAt)}</td>
              <td className="py-2 pr-3 align-top">
                <strong>{order.orderNumber}</strong>
                <div className="text-xs text-stone-500">{order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {order.checkoutMode}</div>
              </td>
              <td className="py-2 pr-3 align-top">
                {order.customerName || 'Guest / draft'}
                {order.customerPhone ? <div className="text-xs text-stone-500">{order.customerPhone}</div> : null}
              </td>
              <td className="py-2 pr-3 align-top">
                {order.status}
                {order.latestPaymentStatus ? <div className="text-xs text-stone-500">Payment: {order.latestPaymentStatus}</div> : null}
              </td>
              <td className="py-2 pr-3 align-top font-semibold">{formatMinorUnitAmount(order.totalCents, order.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
