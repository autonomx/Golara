import { logoutAction } from '@/app/admin/logout/actions';

type AdminCmsStatusPanelProps = {
  databaseReady: boolean;
  authenticated: boolean;
  t?: (key: string) => string;
};

const secondaryButtonClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';

function cmsStatusTitle(databaseReady: boolean, authenticated: boolean) {
  if (databaseReady && authenticated) return 'Editing enabled';
  if (databaseReady) return 'Login required';
  return 'Seeded preview mode';
}

function cmsStatusBody(databaseReady: boolean, authenticated: boolean) {
  if (databaseReady && authenticated) {
    return 'Admin forms are live. Changes write to Prisma, then revalidate storefront pages.';
  }

  if (databaseReady) {
    return 'The database is connected, but CMS writes require admin authentication.';
  }

  return 'The storefront is reading seeded fallback content. Add DATABASE_URL, run npm run db:push and npm run db:seed, then restart the app to enable editing.';
}

export function AdminCmsStatusPanel({ databaseReady, authenticated, t = (key: string) => key }: AdminCmsStatusPanelProps) {
  return (
    <section className={`rounded-lg border p-6 ${databaseReady && authenticated ? 'border-olive/20 bg-white' : 'border-amber-300 bg-amber-50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('CMS status')}</p>
          <h2 className="mt-3 font-display text-3xl text-rosewood">{t(cmsStatusTitle(databaseReady, authenticated))}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">{t(cmsStatusBody(databaseReady, authenticated))}</p>
        </div>
        {authenticated ? (
          <form action={logoutAction}>
            <button className={secondaryButtonClass} type="submit">{t('Sign out')}</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
