import Link from 'next/link';
import { requestCustomerOtpAction, verifyCustomerOtpAction } from '@/app/account/login/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCustomerCopy } from '@/lib/localization/customer-copy';
import { getLoginStatusCopy } from '@/lib/localization/account-flow-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key);

function safeReturnTo(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export default async function AccountLoginPage({ searchParams }: { searchParams: Promise<{ status?: string; phone?: string; returnTo?: string }> }) {
  const { status, phone = '', returnTo } = await searchParams;
  const normalizedReturnTo = safeReturnTo(returnTo);
  const message = getLoginStatusCopy(status);
  const showVerify = Boolean(phone) && !['request-failed', 'database-required', 'rate_limited'].includes(status || '');

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('login.eyebrow')}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('login.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
          {copy('login.longSubtitle')}
        </p>

        {message ? (
          <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">{copy('login.unavailableTitle')}</h2>
            <p className="mt-3 text-sm leading-6">{copy('login.unavailableBody')}</p>
          </div>
        ) : null}

        {hasDatabase() ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">{copy('login.requestTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{copy('login.requestSafetyNote')}</p>
              <form action={requestCustomerOtpAction} className="mt-5 grid gap-4">
                <input type="hidden" name="returnTo" value={normalizedReturnTo} />
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('login.phoneLabel')}
                  <input name="phone" required defaultValue={phone} placeholder="+989121234567" inputMode="tel" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                  {copy('login.requestCode')}
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">{copy('login.verifyTitle')}</h2>
              {showVerify ? (
                <form action={verifyCustomerOtpAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="returnTo" value={normalizedReturnTo} />
                  <input type="hidden" name="phone" value={phone} />
                  <p className="text-sm leading-6 text-stone-700">{copy('login.codeFor')} <strong>{phone}</strong></p>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    {copy('login.codeLabel')}
                    <input name="code" required inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={8} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                  </label>
                  <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                    {copy('login.verifyAndSignIn')}
                  </button>
                </form>
              ) : (
                <p className="mt-5 text-sm leading-6 text-stone-700">{copy('login.requestFirst')}</p>
              )}
            </section>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">{copy('common.accountOverview')}</Link>
          <Link href="/cart/checkout" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">{copy('common.backToCheckout')}</Link>
        </div>
      </section>
    </main>
  );
}
