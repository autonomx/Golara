import Link from 'next/link';
import { redirect } from 'next/navigation';
import { updateAccountProfileAction } from '@/app/account/profile/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { safeCustomerProfileReturnTo } from '@/lib/customers/customer-profile-completion';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getCustomerLocaleOptionLabel } from '@/lib/localization/customer-locale-options';
import { getCustomerCopy, getCustomerCopyDirection, type CustomerCopyKey } from '@/lib/localization/customer-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function statusMessageKey(status?: string): CustomerCopyKey | undefined {
  if (status === 'updated') return 'profile.status.updated';
  if (status === 'complete-profile') return 'profile.status.completeProfile';
  if (status === 'missing-name') return 'profile.status.missingName';
  if (status === 'database-required') return 'profile.status.databaseRequired';
  if (status === 'failed') return 'profile.status.failed';
  return undefined;
}

export default async function AccountProfilePage({ searchParams }: { searchParams: Promise<{ status?: string; returnTo?: string }> }) {
  if (!hasDatabase()) {
    const storefrontLocale = await resolveStorefrontLocale();
    const dir = getCustomerCopyDirection(storefrontLocale);
    const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, storefrontLocale);
    return (
      <main id="main-content" tabIndex={-1} dir={dir}>
        <SiteHeader locale={storefrontLocale} />
        <section className="mx-auto max-w-4xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('profile.eyebrow')}</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('profile.title')}</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">{copy('profile.unavailableBody')}</div>
        </section>
      </main>
    );
  }

  const [{ status, returnTo }, token] = await Promise.all([searchParams, getCustomerSessionCookie()]);
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  const locale = session.customer.locale;
  const dir = getCustomerCopyDirection(locale);
  const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale);
  const localeOptionLabel = (value: Parameters<typeof getCustomerLocaleOptionLabel>[0]) => getCustomerLocaleOptionLabel(value, locale);
  const messageKey = statusMessageKey(status);
  const message = messageKey ? copy(messageKey) : undefined;
  const normalizedReturnTo = returnTo ? safeCustomerProfileReturnTo(returnTo) : '';
  const completingProfile = status === 'complete-profile' || Boolean(normalizedReturnTo);

  return (
    <main id="main-content" tabIndex={-1} dir={dir}>
      <SiteHeader locale={locale} />
      <section className="mx-auto max-w-4xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('profile.eyebrow')}</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('profile.title')}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">{copy(completingProfile ? 'profile.completionSubtitle' : 'profile.subtitle')}</p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">{copy('common.accountOverview')}</Link>
        </div>

        {message ? <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">{message}</div> : null}

        <form action={updateAccountProfileAction} className="mt-8 grid gap-5 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
          <input type="hidden" name="returnTo" value={normalizedReturnTo} />
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            {copy('profile.displayName')}
            <input name="displayName" required={completingProfile} defaultValue={session.customer.displayName || ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            {copy('common.email')}
            <input name="email" type="email" defaultValue={session.customer.email || ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            {copy('common.locale')}
            <select name="locale" defaultValue={session.customer.locale || 'fa-IR'} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
              <option value="fa-IR">{localeOptionLabel('fa-IR')}</option>
              <option value="en-CA">{localeOptionLabel('en-CA')}</option>
            </select>
          </label>
          <div className="rounded-3xl border border-rosewood/10 bg-cream p-4 text-sm leading-6 text-stone-700">
            <strong className="text-rosewood">{copy('profile.verifiedPhone')}:</strong> {session.customer['phone']}<br />
            {copy('profile.phoneDeferredNote')}
          </div>
          <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">{copy(completingProfile ? 'profile.completeProfile' : 'profile.updateProfile')}</button>
        </form>
      </section>
    </main>
  );
}
