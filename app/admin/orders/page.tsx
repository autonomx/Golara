import Link from 'next/link';
import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { listAdminCheckoutOrderPage } from '@/lib/checkout/admin-order-repository';
import { formatMinorUnitAmount, type CheckoutOrderSummary } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

type AdminOrdersSearchParams = { [key: string]: string | undefined };

type OrderQueue = {
  key: string;
  label: string;
  href: string;
  match: (order: CheckoutOrderSummary) => boolean;
};

const orderQueues: OrderQueue[] = [
  { key: 'new', label: 'New', href: '/admin/orders?orderStatus=pending', match: (order) => order.status === 'pending' },
  { key: 'paid', label: 'Paid', href: '/admin/orders?orderPaymentStatus=paid', match: (order) => order.latestPaymentStatus === 'paid' },
  { key: 'preparing', label: 'Preparing', href: '/admin/orders?orderFulfillmentStatus=preparing', match: (order) => order.fulfillmentStatus === 'preparing' },
  { key: 'ready', label: 'Ready', href: '/admin/orders?orderFulfillmentStatus=ready', match: (order) => order.fulfillmentStatus === 'ready' },
  { key: 'delivered', label: 'Delivered', href: '/admin/orders?orderFulfillmentStatus=delivered', match: (order) => order.fulfillmentStatus === 'delivered' },
  { key: 'review', label: 'Needs review', href: '/admin/orders?orderPaymentStatus=requires_review', match: (order) => Boolean(order.latestPaymentRequiresManualReview || order.latestPaymentStatus === 'failed' || order.latestPaymentStatus === 'requires_review') }
];

function nextOrderAction(order: CheckoutOrderSummary) {
  if (order.latestPaymentRequiresManualReview || order.latestPaymentStatus === 'requires_review') return 'Review payment';
  if (order.latestPaymentStatus === 'failed') return 'Resolve payment';
  if (order.latestPaymentStatus === 'paid' && (!order.fulfillmentStatus || order.fulfillmentStatus === 'pending')) return 'Start fulfillment';
  if (order.fulfillmentStatus === 'preparing') return 'Mark ready';
  if (order.fulfillmentStatus === 'ready') return 'Arrange delivery';
  if (order.status === 'pending') return 'Confirm order';
  return 'Open order';
}

function OrderOperationsQueue({ orders }: { orders: CheckoutOrderSummary[] }) {
  const attentionOrders = orders
    .filter((order) => nextOrderAction(order) !== 'Open order')
    .slice(0, 6);

  return (
    <section className="bg-cream px-4 pt-4 sm:px-6 lg:px-8" aria-labelledby="order-queue-title">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-xl border border-rosewood/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Operations queue</p>
            <h2 id="order-queue-title" className="mt-1 text-xl font-semibold text-stone-900">Orders by next action</h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">Process orders by queue state first, then use the full table below for exports, printing, search, and detailed status updates.</p>
          </div>
          <Link href="/admin/orders/print" className="rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-white">Print orders</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {orderQueues.map((queue) => (
            <Link key={queue.key} href={queue.href} className="rounded-full border border-rosewood/15 px-3 py-2 text-sm font-semibold text-rosewood hover:border-rosewood">
              {queue.label}: {orders.filter(queue.match).length}
            </Link>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {attentionOrders.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 md:col-span-2 xl:col-span-3">No urgent order actions are waiting in the current queue sample.</p>
          ) : attentionOrders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="rounded-lg border border-stone-200 p-3 text-sm hover:border-rosewood/40">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-stone-900">{order.orderNumber}</span>
                <span className="rounded-full bg-rosewood/10 px-2 py-1 text-xs font-semibold text-rosewood">{nextOrderAction(order)}</span>
              </span>
              <span className="mt-2 block text-xs text-stone-500">{order.customerName || order.customerPhone || 'Customer'} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}</span>
              <span className="mt-1 block text-xs font-semibold text-stone-700">{formatMinorUnitAmount(order.totalCents, order.currency)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<AdminOrdersSearchParams> }) {
  await requireAdminRouteSession();
  const resolvedSearchParams = await searchParams;
  const orderPage = await listAdminCheckoutOrderPage({
    status: resolvedSearchParams.orderStatus,
    paymentStatus: resolvedSearchParams.orderPaymentStatus,
    fulfillmentStatus: resolvedSearchParams.orderFulfillmentStatus,
    search: resolvedSearchParams.orderSearch
  }, 1, 50);

  return (
    <>
      <OrderOperationsQueue orders={orderPage.orders} />
      <AdminConsolePage searchParams={Promise.resolve(resolvedSearchParams)} forcedTab="sales" salesSection="orders" activeNavKey="orders" />
    </>
  );
}
