import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginAction } from './actions';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect('/admin');
  const { error } = await searchParams;
  const configured = isAdminAuthConfigured();

  return (
    <main className="min-h-screen bg-cream px-5 py-16">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-xl shadow-rosewood/10">
        <Link href="/" className="font-display text-3xl text-rosewood">Golara</Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin login</p>
        <h1 className="mt-3 font-display text-5xl text-rosewood">Sign in to edit the CMS.</h1>
        <p className="mt-4 text-sm leading-6 text-stone-700">The admin dashboard is protected by an environment-based password gate. Full multi-user roles can be added later when customer accounts are introduced.</p>

        {!configured ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Admin auth is not configured. Set <code>ADMIN_PASSWORD</code> and <code>ADMIN_SESSION_SECRET</code> in <code>.env.local</code> before using CMS writes.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        ) : null}

        <form action={loginAction} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-rosewood">
            Admin password
            <input
              className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood disabled:cursor-not-allowed disabled:bg-stone-100"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!configured}
            />
          </label>
          <button className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!configured}>
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
