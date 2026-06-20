import Link from 'next/link';

import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { buildSiteAnalyticsRetentionCleanupPlan } from '@/lib/analytics/site-analytics-retention-cleanup-plan';
import { siteAnalyticsRetentionService } from '@/lib/analytics/site-analytics-retention';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';

export const dynamic = 'force-dynamic';

const PLAN_FLAG = 'SITE_ANALYTICS_RETENTION_CLEANUP_PLAN_ENABLED';
const EXECUTION_FLAG = 'SITE_ANALYTICS_RETENTION_CLEANUP_EXECUTION_ENABLED';
const CLEANUP_ROUTE = '/admin/analytics/site-retention/cleanup';

function flagEnabled(name: string) {
  const value = process.env[name]?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export default async function SiteRetentionPage() {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [products, categories, media, summary] = await Promise.all([
    listAdminProducts(),
    listAdminCategories(),
    listMedia(),
    siteAnalyticsRetentionService.summary()
  ]);
  const plan = buildSiteAnalyticsRetentionCleanupPlan({
    actorRole: identity.role === 'owner' ? 'owner' : identity.role === 'staff' ? 'staff' : 'public',
    summary,
    deletionPlanEnabled: flagEnabled(PLAN_FLAG),
    maxDeletionBatchSize: 1000
  });
  const executionFlagEnabled = flagEnabled(EXECUTION_FLAG);

  return (
    <AdminPageShell
      activeTab="analytics"
      activeNavKey="analytics"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/analytics/site-retention"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Analytics / Site retention</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">Site analytics retention cleanup</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Owner-visible status for raw event retention cleanup. The cleanup route remains hard-gated, manual-only,
                and has no deletion delegate attached by default.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-800">
              Manual gate
            </span>
          </div>
          <Link
            href="/admin/analytics"
            className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:border-olive hover:text-olive"
          >
            Back to analytics workspace
          </Link>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Retention summary</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">Raw event eligibility</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Total events</dt>
              <dd className="mt-1 text-lg font-bold text-stone-950">{summary.totalEventCount}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Stale events</dt>
              <dd className="mt-1 text-lg font-bold text-stone-950">{summary.staleEventCount}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Eligible events</dt>
              <dd className="mt-1 text-lg font-bold text-stone-950">{summary.cleanupPreview.eligibleEventCount}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Planned max batch</dt>
              <dd className="mt-1 text-lg font-bold text-stone-950">{plan.plannedDeletionCount}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Execution gates</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">Manual cleanup readiness</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Plan flag</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{flagEnabled(PLAN_FLAG) ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Execution flag</p>
              <p className="mt-1 text-sm font-bold text-stone-950">{executionFlagEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Route delegate</p>
              <p className="mt-1 text-sm font-bold text-stone-950">Not attached by default</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Background job</p>
              <p className="mt-1 text-sm font-bold text-stone-950">Not started</p>
            </div>
          </div>
          {plan.blockers.length > 0 ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-950">Blocked checks</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-950">
                {plan.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
              The cleanup plan is ready for a manual owner route check. The route still cannot delete events without a delegate.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Owner route check</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">Manual confirmation form</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            This form posts to the owner-only route with the required confirmation phrase. The current route reports its gated state and uses no deletion delegate by default.
          </p>
          <form action={CLEANUP_ROUTE} method="post" className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
            <label className="block text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="manualOwnerConfirmation">
              Confirmation phrase
            </label>
            <input
              id="manualOwnerConfirmation"
              name="manualOwnerConfirmation"
              defaultValue="confirm-retention-cleanup"
              className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            />
            <p className="mt-2 text-xs leading-5 text-stone-500">POST target: {CLEANUP_ROUTE}</p>
            <button
              type="submit"
              disabled={!plan.accepted || !executionFlagEnabled}
              aria-disabled={!plan.accepted || !executionFlagEnabled}
              className="mt-3 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-500"
            >
              Check owner cleanup route
            </button>
          </form>
        </section>
      </div>
    </AdminPageShell>
  );
}
