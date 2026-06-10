import Link from 'next/link';
import { redirect } from 'next/navigation';
import { addAccountAddressAction, deleteAccountAddressAction, setDefaultAccountAddressAction, updateAccountAddressAction } from '@/app/account/addresses/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { listCustomerAddresses } from '@/lib/customers/customer-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getAddressBookCopy, getAddressBookStatusCopy, type AddressBookCopyKey } from '@/lib/localization/customer-address-copy';
import { getCustomerCopyDirection } from '@/lib/localization/customer-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type AddressFieldCopy = (key: AddressBookCopyKey) => string;

function AddressFields({
  prefix = '',
  address,
  copy
}: {
  prefix?: string;
  address?: {
    label: string;
    recipient: string | null;
    phone: string | null;
    city: string | null;
    line1: string;
    line2: string | null;
    notes: string | null;
    isDefault: boolean;
  };
  copy: AddressFieldCopy;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{copy('label')}<input name={`${prefix}label`} defaultValue={address?.label ?? copy('title')} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{copy('recipient')}<input name={`${prefix}recipient`} defaultValue={address?.recipient ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{copy('phone')}<input name={`${prefix}phone`} defaultValue={address?.phone ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{copy('city')}<input name={`${prefix}city`} defaultValue={address?.city ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">{copy('line1')}<input name={`${prefix}line1`} required minLength={4} defaultValue={address?.line1 ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">{copy('line2')}<input name={`${prefix}line2`} defaultValue={address?.line2 ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">{copy('notes')}<textarea name={`${prefix}notes`} defaultValue={address?.notes ?? ''} className="min-h-20 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold text-rosewood md:col-span-2"><input name={`${prefix}isDefault`} type="checkbox" defaultChecked={address?.isDefault ?? false} className="h-4 w-4 rounded border-rosewood/20" /> {copy('useDefault')}</label>
    </div>
  );
}

export default async function AccountAddressesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!hasDatabase()) {
    const storefrontLocale = await resolveStorefrontLocale();
    const dir = getCustomerCopyDirection(storefrontLocale);
    const copy = (key: AddressBookCopyKey) => getAddressBookCopy(key, storefrontLocale);
    return (
      <main id="main-content" tabIndex={-1} dir={dir}>
        <SiteHeader locale={storefrontLocale} />
        <section className="mx-auto max-w-5xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('eyebrow')}</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('title')}</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">{copy('unavailable')}</div>
        </section>
      </main>
    );
  }

  const [{ status }, token] = await Promise.all([searchParams, getCustomerSessionCookie()]);
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  const locale = session.customer.locale;
  const dir = getCustomerCopyDirection(locale);
  const copy = (key: AddressBookCopyKey) => getAddressBookCopy(key, locale);
  const addresses = await listCustomerAddresses(session.customerId);
  const message = getAddressBookStatusCopy(status, locale);

  return (
    <main id="main-content" tabIndex={-1} dir={dir}>
      <SiteHeader locale={locale} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('eyebrow')}</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('title')}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">{copy('subtitle')}</p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">{copy('accountOverview')}</Link>
        </div>

        {message ? <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">{message}</div> : null}

        <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-4xl text-rosewood">{copy('addTitle')}</h2>
          <form action={addAccountAddressAction} className="mt-5 grid gap-4">
            <AddressFields copy={copy} />
            <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">{copy('save')}</button>
          </form>
        </section>

        <section className="mt-8 grid gap-4">
          {addresses.length === 0 ? <p className="rounded-[2rem] border border-rosewood/10 bg-white p-6 text-sm text-stone-700 shadow-sm">{copy('empty')}</p> : null}
          {addresses.map((address) => (
            <article key={address.id} className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-rosewood">{address.label}{address.isDefault ? ` · ${copy('defaultBadge')}` : ''}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />{address.city || copy('cityNotSet')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <form action={setDefaultAccountAddressAction}>
                      <input type="hidden" name="addressId" value={address.id} />
                      <button type="submit" className="rounded-full border border-rosewood/20 px-4 py-2 text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">{copy('makeDefault')}</button>
                    </form>
                  ) : null}
                  <form action={deleteAccountAddressAction}>
                    <input type="hidden" name="addressId" value={address.id} />
                    <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 outline-none transition focus-visible:ring-4 focus-visible:ring-red-200">{copy('delete')}</button>
                  </form>
                </div>
              </div>
              <form action={updateAccountAddressAction} className="mt-5 grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-4">
                <input type="hidden" name="addressId" value={address.id} />
                <AddressFields address={address} copy={copy} />
                <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">{copy('update')}</button>
              </form>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
