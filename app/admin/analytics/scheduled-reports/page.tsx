import Link from 'next/link';

import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { buildScheduledReportManagementSurfaceContract } from '@/lib/analytics/admin-analytics-scheduled-report-management-surface';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsScheduledReportsPage() {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const isOwner = identity.role === 'owner';
  const surface = buildScheduledReportManagementSurfaceContract({ isOwner });
  const [products, categories, media] = await Promise.all([listAdminProducts(), listAdminCategories(), listMedia()]);

  return (
    <AdminPageShell
      activeTab="analytics"
      activeNavKey="analytics"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/analytics/scheduled-reports"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Analytics / Scheduled reports</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">Scheduled report management</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Owner-facing scheduled-report controls are visible here as a readiness surface. Runtime repository reads,
                writes, scheduler execution, and delivery remain disabled until separate activation slices are approved.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
              Runtime disabled
            </span>
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Owner access</p>
            <p className="mt-1 text-sm leading-6 text-amber-950">
              {isOwner
                ? 'Owner session detected. Controls remain locked until repository and recording gates are explicitly enabled.'
                : 'Staff session detected. Scheduled-report controls are owner-only and remain locked.'}
            </p>
          </div>
          <Link
            href="/admin/analytics"
            className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:border-olive hover:text-olive"
          >
            Back to analytics workspace
          </Link>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Gate status</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">Management controls are present but locked</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Read repository</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.repositoryReadPathEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Write repository</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.repositoryWritePathEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Delivery execution</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.deliveryExecutionEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Control readiness</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {surface.controls.map((control) => (
              <article key={control.key} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-stone-950">{control.label}</h3>
                  <span className="rounded-full border border-stone-300 bg-white px-2 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-stone-600">
                    {control.enabled ? 'Enabled' : 'Locked'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">{control.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Activation checklist</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-stone-700">
            {surface.requiredBeforeActivation.map((item) => (
              <li key={item} className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminPageShell>
  );
}
