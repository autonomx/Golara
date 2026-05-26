import Link from 'next/link';
import { redirect } from 'next/navigation';
import { addAccountAddressAction, deleteAccountAddressAction, setDefaultAccountAddressAction, updateAccountAddressAction } from '@/app/account/addresses/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { listCustomerAddresses } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function statusMessage(status?: string) {
  if (status === 'added') return 'Address added.';
  if (status === 'updated') return 'Address updated.';
  if (status === 'default-updated') return 'Default address updated.';
  if (status === 'deleted') return 'Address deleted.';
  if (status === 'database-required') return 'Address management requires a configured database.';
  if (status === 'failed') return 'We could not update addresses. Please try again.';
  return undefined;
}

function AddressFields({ prefix = '', address }: { prefix?: string; address?: { label: string; recipient: string | null; phone: string | null; city: string | null; line1: string; line2: string | null; notes: string | null; isDefault: boolean } }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Label<input name={`${prefix}label`} defaultValue={address?.label ?? 'Delivery address'} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Recipient<input name={`${prefix}recipient`} defaultValue={address?.recipient ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Phone<input name={`${prefix}phone`} defaultValue={address?.phone ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">City<input name={`${prefix}city`} defaultValue={address?.city ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">Address line 1<input name={`${prefix}line1`} required minLength={4} defaultValue={address?.line1 ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">Address line 2<input name={`${prefix}line2`} defaultValue={address?.line2 ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">Notes<textarea name={`${prefix}notes`} defaultValue={address?.notes ?? ''} className="min-h-20 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold text-rosewood md:col-span-2"><input name={`${prefix}isDefault`} type="checkbox" defaultChecked={address?.isDefault ?? false} className="h-4 w-4 rounded border-rosewood/20" /> Use as default address</label>
    </div>
  );
}

export default async function AccountAddressesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!hasDatabase()) {
    return (
      <main id="main-content" tabIndex={-1}>
        <SiteHeader />
        <section className="mx-auto max-w-5xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Saved addresses</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">Address book</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">Address management requires a configured database.</div>
        </section>
      </main>
    );
  }

  const [{ status }, token] = await Promise.all([searchParams, getCustomerSessionCookie()]);
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  const addresses = await listCustomerAddresses(session.customerId);
  const message = statusMessage(status);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Saved addresses</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">Address book</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">Manage delivery addresses connected to your signed-in customer profile.</p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">Account overview</Link>
        </div>

        {message ? <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">{message}</div> : null}

        <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-4xl text-rosewood">Add address</h2>
          <form action={addAccountAddressAction} className="mt-5 grid gap-4">
            <AddressFields />
            <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">Save address</button>
          </form>
        </section>

        <section className="mt-8 grid gap-4">
          {addresses.length === 0 ? <p className="rounded-[2rem] border border-rosewood/10 bg-white p-6 text-sm text-stone-700 shadow-sm">No saved addresses yet.</p> : null}
          {addresses.map((address) => (
            <article key={address.id} className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-rosewood">{address.label}{address.isDefault ? ' · Default' : ''}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city || 'City not set'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <form action={setDefaultAccountAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <button type="submit" className="rounded-full border border-rosewood/20 px-4 py-2 text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">Make default</button>
                    </form>
                  ) : null}
                  <form action={deleteAccountAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 outline-none transition focus-visible:ring-4 focus-visible:ring-red-200">Delete</button>
                  </form>
                </div>
              </div>
              <form action={updateAccountAddressAction} className="mt-5 grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-4">
                <input type="hidden" name="addressId" value={address.id} />
                <AddressFields address={address} />
                <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">Update address</button>
              </form>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
