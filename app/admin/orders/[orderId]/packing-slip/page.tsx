import { notFound } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getAdminCheckoutOrder } from '@/lib/checkout/admin-order-repository';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export default async function PackingSlipPage({ params }: { params: Promise<{ orderId: string }> }) {
  await assertAdminRole('staff');
  const { orderId } = await params;
  const order = await getAdminCheckoutOrder(orderId);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-4xl bg-white p-8 text-stone-900">
      <header className="mb-8 border-b border-stone-300 pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-500">Golara packing slip</p>
        <h1 className="mt-2 text-3xl font-bold">{order.orderNumber}</h1>
        <p className="mt-1 text-sm text-stone-600">Created {formatDate(order.createdAt)} · {order.status} · {order.fulfillmentStatus}</p>
      </header>

      <section className="mb-8 grid gap-5 md:grid-cols-3">
        <div>
          <h2 className="mb-2 text-lg font-bold">Recipient</h2>
          <p>{order.recipientName || order.customer?.displayName || 'Not set'}</p>
          <p>{order.recipientPhone || order.customer?.phone || 'Not set'}</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-bold">Delivery</h2>
          <p>{order.deliveryDate ? formatDate(order.deliveryDate) : 'Date not set'}</p>
          <p>{order.deliveryWindow || 'Window not set'}</p>
          <p>{order.address ? `${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ''}` : 'Address not set'}</p>
          {order.address?.city ? <p>{order.address.city}</p> : null}
        </div>
        <div>
          <h2 className="mb-2 text-lg font-bold">Fulfillment</h2>
          <p>{order.fulfillmentStatus}</p>
          <p>{order.courierName || 'Courier not set'}</p>
          <p>{order.courierPhone || 'Courier phone not set'}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Items</h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-300">
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Code</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-stone-200">
                <td className="py-2 pr-3">{item.productTitle}</td>
                <td className="py-2 pr-3">{item.productCode}</td>
                <td className="py-2 pr-3">{item.quantity}</td>
                <td className="py-2 pr-3">{formatMinorUnitAmount(item.lineTotalCents, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-3 text-sm">
        <p><strong>Total:</strong> {formatMinorUnitAmount(order.totalCents, order.currency)}</p>
        <p><strong>Customer note:</strong> {order.customerNote || 'None'}</p>
        <p><strong>Address note:</strong> {order.address?.notes || 'None'}</p>
        <p><strong>Fulfillment note:</strong> {order.fulfillmentNote || 'None'}</p>
        <p><strong>Staff note:</strong> {order.staffNotes || 'None'}</p>
      </section>
    </main>
  );
}
