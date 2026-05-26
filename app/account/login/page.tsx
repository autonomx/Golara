import Link from 'next/link';
import { requestCustomerOtpAction, verifyCustomerOtpAction } from '@/app/account/login/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function statusMessage(status?: string) {
  if (status === 'code-sent') return 'Verification code sent. In development, check the server logs for the code.';
  if (status === 'missing_or_expired') return 'The code is missing or expired. Request a new code.';
  if (status === 'invalid_code') return 'The code was not correct. Please try again.';
  if (status === 'too_many_attempts') return 'Too many attempts. Request a new code.';
  if (status === 'database-required') return 'Customer login requires a configured database.';
  if (status === 'request-failed') return 'We could not send a code. Please check the phone number and try again.';
  if (status === 'verify-failed') return 'We could not verify the code. Please try again.';
  return undefined;
}

function safeReturnTo(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export default async function AccountLoginPage({ searchParams }: { searchParams: Promise<{ status?: string; phone?: string; returnTo?: string }> }) {
  const { status, phone = '', returnTo } = await searchParams;
  const normalizedReturnTo = safeReturnTo(returnTo);
  const message = statusMessage(status);
  const showVerify = Boolean(phone) && status !== 'request-failed' && status !== 'database-required';

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Customer login</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">Sign in with phone</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
          Enter your phone number to receive a one-time verification code. This connects your account, order history, saved addresses, and checkout prefill.
        </p>

        {message ? (
          <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">Login unavailable</h2>
            <p className="mt-3 text-sm leading-6">Customer login requires a configured database.</p>
          </div>
        ) : null}

        {hasDatabase() ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">Request code</h2>
              <form action={requestCustomerOtpAction} className="mt-5 grid gap-4">
                <input type="hidden" name="returnTo" value={normalizedReturnTo} />
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Phone number
                  <input name="phone" required defaultValue={phone} placeholder="+989121234567" inputMode="tel" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                  Send verification code
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">Verify code</h2>
              {showVerify ? (
                <form action={verifyCustomerOtpAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="returnTo" value={normalizedReturnTo} />
                  <input type="hidden" name="phone" value={phone} />
                  <p className="text-sm leading-6 text-stone-700">Code for <strong>{phone}</strong></p>
                  <label className="grid gap-2 text-sm font-semibold text-rosewood">
                    Verification code
                    <input name="code" required inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={8} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                  </label>
                  <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                    Verify and sign in
                  </button>
                </form>
              ) : (
                <p className="mt-5 text-sm leading-6 text-stone-700">Request a code first, then return here to verify it.</p>
              )}
            </section>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">Account overview</Link>
          <Link href="/cart/checkout" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">Back to checkout</Link>
        </div>
      </section>
    </main>
  );
}
