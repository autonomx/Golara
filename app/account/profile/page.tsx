import Link from 'next/link';
import { redirect } from 'next/navigation';
import { updateAccountProfileAction } from '@/app/account/profile/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function statusMessage(status?: string) {
  if (status === 'updated') return 'Profile updated.';
  if (status === 'database-required') return 'Profile editing requires a configured database.';
  if (status === 'failed') return 'We could not update your profile. Please check the fields and try again.';
  return undefined;
}

export default async function AccountProfilePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!hasDatabase()) {
    return (
      <main id="main-content" tabIndex={-1}>
        <SiteHeader />
        <section className="mx-auto max-w-4xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Account profile</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">Edit profile</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">Profile editing requires a configured database.</div>
        </section>
      </main>
    );
  }

  const [{ status }, token] = await Promise.all([searchParams, getCustomerSessionCookie()]);
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  const message = statusMessage(status);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Account profile</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">Edit profile</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">Update your display name, email, and locale. Verified phone changes require a separate verification flow and are not edited here.</p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">Account overview</Link>
        </div>

        {message ? <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">{message}</div> : null}

        <form action={updateAccountProfileAction} className="mt-8 grid gap-5 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            Display name
            <input name="displayName" defaultValue={session.customer.displayName || ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            Email
            <input name="email" type="email" defaultValue={session.customer.email || ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            Locale
            <select name="locale" defaultValue={session.customer.locale || 'fa-IR'} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
              <option value="fa-IR">Persian / Iran</option>
              <option value="en-CA">English / Canada</option>
            </select>
          </label>
          <div className="rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm leading-6 text-stone-700">
            <strong className="text-rosewood">Verified phone:</strong> {session.customer.phone}<br />
            Phone changes are intentionally deferred until a separate verification flow is added.
          </div>
          <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">Update profile</button>
        </form>
      </section>
    </main>
  );
}
