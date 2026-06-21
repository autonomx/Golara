import Link from 'next/link';
import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { listAdminCustomers, type AdminCustomerListItem } from '@/lib/customers/customer-repository';

export const dynamic = 'force-dynamic';

type AdminCustomersSearchParams = { [key: string]: string | undefined };

function formatDate(value?: Date | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(value);
}

function nextCustomerAction(customer: AdminCustomerListItem) {
  if (customer.orderCount > 0) return 'Review order history';
  if (customer.addressCount === 0) return 'Confirm address';
  if (!customer.lastLoginAt) return 'Check account setup';
  return 'Review profile';
}

function CustomerTimelineBrief({ customers }: { customers: AdminCustomerListItem[] }) {
  const recentCustomers = customers.slice(0, 6);

  return (
    <section className="bg-cream px-4 pt-4 sm:px-6 lg:px-8" aria-labelledby="customer-brief-title">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-xl border border-rosewood/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">Customer timeline</p>
            <h2 id="customer-brief-title" className="mt-1 text-xl font-semibold text-stone-900">Support brief</h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">Review language, order count, addresses, last login, and the next support action before opening a full customer profile.</p>
          </div>
          <Link href="/admin/orders" className="rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-white">Create draft order</Link>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {recentCustomers.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 md:col-span-2 xl:col-span-3">No customers are available yet.</p>
          ) : recentCustomers.map((customer) => (
            <Link key={customer.id} href={`/admin/customers/${customer.id}`} className="rounded-lg border border-stone-200 p-3 text-sm hover:border-rosewood/40">
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-stone-900">{customer.displayName || customer.phone}</span>
                <span className="rounded-full bg-rosewood/10 px-2 py-1 text-xs font-semibold text-rosewood">{customer.locale}</span>
              </span>
              <span className="mt-2 block text-xs text-stone-500">{customer.orderCount} orders · {customer.addressCount} addresses · {customer.accountCount} accounts</span>
              <span className="mt-1 block text-xs text-stone-500">Last login: {formatDate(customer.lastLoginAt)}</span>
              <span className="mt-2 block text-xs font-semibold text-rosewood">{nextCustomerAction(customer)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<AdminCustomersSearchParams> }) {
  await requireAdminRouteSession();
  const resolvedSearchParams = await searchParams;
  const customers = await listAdminCustomers();

  return (
    <>
      <CustomerTimelineBrief customers={customers} />
      <AdminConsolePage searchParams={Promise.resolve(resolvedSearchParams)} forcedTab="customers" activeNavKey="customers" />
    </>
  );
}
