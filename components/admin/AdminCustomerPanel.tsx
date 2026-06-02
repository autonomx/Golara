import type { AdminCustomerListItem } from '@/lib/customers/customer-repository';
import Link from 'next/link';

function formatDate(value?: Date | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(value);
}

export function AdminCustomerPanel({ customers, databaseReady }: { customers: AdminCustomerListItem[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Customers</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Customer profiles</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Review customer account records, addresses, and linked order counts before the full customer detail workflow is added.
          </p>
        </div>
        <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">
          {customers.length} profiles
        </span>
      </div>

      {!databaseReady ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Customer admin requires a configured database.
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
          No customer profiles yet.
        </div>
      ) : (
        <div className="mt-6 overflow-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Addresses</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-stone-200 align-top">
                  <td className="px-4 py-4">
                    <Link href={`/admin/customers/${customer.id}`} className="font-semibold text-stone-950 underline-offset-4 hover:underline">
                      {customer.displayName || 'Unnamed customer'}
                    </Link>
                    <div className="mt-1 text-xs text-stone-500">{customer.email || 'No email'}</div>
                  </td>
                  <td className="px-4 py-4 text-stone-700">{customer.phone}</td>
                  <td className="px-4 py-4 text-stone-700">{customer.locale}</td>
                  <td className="px-4 py-4 text-stone-700">{customer.orderCount}</td>
                  <td className="px-4 py-4 text-stone-700">{customer.addressCount}</td>
                  <td className="px-4 py-4 text-stone-700">{formatDate(customer.lastLoginAt)}</td>
                  <td className="px-4 py-4 text-stone-700">{formatDate(customer.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
