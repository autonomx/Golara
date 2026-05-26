import Link from 'next/link';
import { logoutCustomerAction } from '@/app/account/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function statusMessage(status?: string) {
  if (status === 'signed-out') return 'You have been signed out.';
  if (status === 'session-required') return 'Please sign in to view your account.';
  return undefined;
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }, token] = await Promise.all([searchParams, getCustomerSessionCookie()]);
  const session = hasDatabase() ? await getCustomerSession(token) : null;
  const message = statusMessage(status);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Customer account</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">Your Golara account</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
          Account access will connect your saved contact details, delivery addresses, and order history.
        </p>

        {message ? (
          <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">Accounts unavailable</h2>
            <p className="mt-3 text-sm leading-6">Customer accounts require a configured database.</p>
          </div>
        ) : null}

        {hasDatabase() && session ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">Account profile</h2>
              <div className="mt-5 grid gap-3 text-sm text-stone-700">
                <p><strong>Name:</strong> {session.customer.displayName || 'Not set'}</p>
                <p><strong>Phone:</strong> {session.customer.phone}</p>
                <p><strong>Email:</strong> {session.customer.email || 'Not set'}</p>
                <p><strong>Locale:</strong> {session.customer.locale}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/account/orders" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                  View order history
                </Link>
                <form action={logoutCustomerAction}>
                  <button type="submit" className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                    Sign out
                  </button>
                </form>
              </div>
            </section>

            <aside className="rounded-[2rem] border border-rosewood/10 bg-cream p-6">
              <h2 className="font-display text-3xl text-rosewood">Saved addresses</h2>
              {session.customer.addresses.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-stone-700">No saved addresses yet. Checkout will add delivery addresses to your profile.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {session.customer.addresses.map((address) => (
                    <article key={address.id} className="rounded-2xl border border-rosewood/10 bg-white p-4 text-sm text-stone-700">
                      <p className="font-semibold text-rosewood">{address.label}{address.isDefault ? ' · Default' : ''}</p>
                      <p className="mt-1">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                      <p>{address.city || 'City not set'}</p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>
        ) : null}

        {hasDatabase() && !session ? (
          <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
            <h2 className="font-display text-4xl text-rosewood">Sign-in foundation</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-700">
              The account data model and session cookie are ready. The next bundle will choose or implement the phone-first sign-in flow that creates a customer session.
            </p>
            <div className="mt-6 grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-5 text-sm text-stone-700">
              <p><strong>Planned:</strong> phone-first login or provider-backed authentication.</p>
              <p><strong>Planned:</strong> order history tied to authenticated customer ownership.</p>
              <p><strong>Planned:</strong> saved address management and checkout prefill.</p>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
