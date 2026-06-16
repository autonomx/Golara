import Link from 'next/link';
import { logoutCustomerAction } from '@/app/account/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getCustomerCopy, getCustomerCopyDirection, type CustomerCopyKey } from '@/lib/localization/customer-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function statusMessageKey(status?: string): CustomerCopyKey | undefined {
  if (status === 'signed-out') return 'account.status.signedOut';
  if (status === 'session-required') return 'account.status.sessionRequired';
  return undefined;
}

function walletLinkLabel(locale?: string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'کیف پول' : 'Wallet';
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }, token, storefrontLocale] = await Promise.all([searchParams, getCustomerSessionCookie(), resolveStorefrontLocale()]);
  const session = hasDatabase() ? await getCustomerSession(token) : null;
  const locale = session?.customer.locale || storefrontLocale;
  const dir = getCustomerCopyDirection(locale);
  const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale);
  const messageKey = statusMessageKey(status);
  const message = messageKey ? copy(messageKey) : undefined;

  return (
    <main id="main-content" tabIndex={-1} dir={dir}>
      <SiteHeader locale={locale} />
      <section className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('account.eyebrow')}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('account.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
          {copy('account.subtitle')}
        </p>

        {message ? (
          <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">{copy('account.accountsUnavailableTitle')}</h2>
            <p className="mt-3 text-sm leading-6">{copy('account.accountsUnavailableBody')}</p>
          </div>
        ) : null}

        {hasDatabase() && session ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">{copy('account.profileTitle')}</h2>
              <div className="mt-5 grid gap-3 text-sm text-stone-700">
                <p><strong>{copy('common.name')}:</strong> {session.customer.displayName || copy('common.notSet')}</p>
                <p><strong>{copy('common.phone')}:</strong> {session.customer['phone']}</p>
                <p><strong>{copy('common.email')}:</strong> {session.customer.email || copy('common.notSet')}</p>
                <p><strong>{copy('common.locale')}:</strong> {session.customer.locale}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/account/profile" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                  {copy('account.editProfile')}
                </Link>
                <Link href="/account/orders" className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                  {copy('account.orderHistory')}
                </Link>
                <Link href="/account/wallet" className="rounded-full border border-olive/30 bg-cream px-6 py-3 text-sm font-semibold text-olive outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                  {walletLinkLabel(locale)}
                </Link>
                <form action={logoutCustomerAction}>
                  <button type="submit" className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                    {copy('account.signOut')}
                  </button>
                </form>
              </div>
            </section>

            <aside className="rounded-[2rem] border border-rosewood/10 bg-cream p-6">
              <h2 className="font-display text-3xl text-rosewood">{copy('account.savedAddresses')}</h2>
              {session.customer.addresses.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-stone-700">{copy('account.noSavedAddresses')}</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {session.customer.addresses.map((address) => (
                    <article key={address.id} className="rounded-2xl border border-rosewood/10 bg-white p-4 text-sm text-stone-700">
                      <p className="font-semibold text-rosewood">{address.label}{address.isDefault ? ` · ${copy('common.default')}` : ''}</p>
                      <p className="mt-1">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                      <p>{address.city || copy('common.cityNotSet')}</p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>
        ) : null}

        {hasDatabase() && !session ? (
          <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
            <h2 className="font-display text-4xl text-rosewood">{copy('account.signInTitle')}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-700">
              {copy('account.signInBody')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/account/login" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                {copy('account.signInWithPhone')}
              </Link>
              <Link href="/products" className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                {copy('account.continueShopping')}
              </Link>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
