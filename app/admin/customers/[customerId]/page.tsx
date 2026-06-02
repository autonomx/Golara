import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getAdminCustomerDetail } from '@/lib/customers/customer-repository';

export const dynamic = 'force-dynamic';

function formatDate(value?: Date | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function compact(value: string, length = 140) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  await assertAdminRole('staff');
  const { customerId } = await params;
  const customer = await getAdminCustomerDetail(customerId);
  if (!customer) notFound();

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin / Customers</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">{customer.displayName || customer.phone}</h1>
            <p className="mt-4 text-stone-600">{customer.phone} / {customer.email || 'No email'} / {customer.locale}</p>
          </div>
          <Link href="/admin/customers" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood">
            Back to customers
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="grid gap-6">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Profile</h2>
              <div className="mt-5 grid gap-3 text-sm text-stone-700 md:grid-cols-2">
                <p><strong>Name:</strong> {customer.displayName || 'Not set'}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                <p><strong>Email:</strong> {customer.email || 'Not set'}</p>
                <p><strong>Locale:</strong> {customer.locale}</p>
                <p><strong>Created:</strong> {formatDate(customer.createdAt)}</p>
                <p><strong>Updated:</strong> {formatDate(customer.updatedAt)}</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Orders</h2>
              {!customer.orders.length ? <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">No orders yet.</p> : (
                <div className="mt-5 overflow-hidden rounded-3xl border border-rosewood/10">
                  <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
                    <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th></tr></thead>
                    <tbody className="divide-y divide-rosewood/10 text-stone-700">
                      {customer.orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-4 py-3"><Link href={`/admin/orders/${order.id}`} className="font-semibold text-rosewood underline-offset-4 hover:underline">{order.orderNumber}</Link><p className="text-xs text-stone-500">{formatDate(order.createdAt)}</p></td>
                          <td className="px-4 py-3">{order.status} / {order.fulfillmentStatus}{order.paymentStatus ? ` / ${order.paymentStatus}` : ''}</td>
                          <td className="px-4 py-3">{order.itemCount}</td>
                          <td className="px-4 py-3 font-semibold text-rosewood">{formatMinorUnitAmount(order.totalCents, order.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Inquiries</h2>
              {!customer.inquiries.length ? <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">No matching inquiries yet.</p> : (
                <div className="mt-5 grid gap-3">
                  {customer.inquiries.map((inquiry) => (
                    <article key={inquiry.id} className="rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">
                      <div className="flex flex-wrap items-start justify-between gap-3"><p className="font-semibold text-rosewood">{inquiry.productTitle || 'General inquiry'}</p><span>{inquiry.status}</span></div>
                      <p className="mt-2">{compact(inquiry.message)}</p>
                      <p className="mt-2 text-xs text-stone-500">Created {formatDate(inquiry.createdAt)}{inquiry.deliveryDate ? ` / Delivery ${formatDate(inquiry.deliveryDate)}` : ''}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="grid content-start gap-6">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Accounts</h2>
              {!customer.accounts.length ? <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">No linked accounts.</p> : (
                <div className="mt-4 grid gap-3">{customer.accounts.map((account) => <article key={account.id} className="rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700"><p className="font-semibold text-rosewood">{account.provider}</p><p className="mt-1 break-all text-xs">{account.providerAccountId}</p><p className="mt-2">Last login: {formatDate(account.lastLoginAt)}</p></article>)}</div>
              )}
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">Addresses</h2>
              {!customer.addresses.length ? <p className="mt-4 rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700">No saved addresses.</p> : (
                <div className="mt-4 grid gap-3">{customer.addresses.map((address) => <article key={address.id} className="rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm text-stone-700"><p className="font-semibold text-rosewood">{address.label}{address.isDefault ? ' / Default' : ''}</p><p className="mt-2">{address.recipient || customer.displayName || 'Recipient'} / {address.phone || customer.phone}</p><p className="mt-1">{address.line1}{address.line2 ? `, ${address.line2}` : ''}{address.city ? `, ${address.city}` : ''}</p>{address.notes ? <p className="mt-2 text-xs text-stone-500">{address.notes}</p> : null}</article>)}</div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
