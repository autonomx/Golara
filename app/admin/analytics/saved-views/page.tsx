import Link from 'next/link';

import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { buildAdminAnalyticsSavedViewManagementPreview } from '@/lib/analytics/admin-analytics-saved-view-management';
import { buildAdminAnalyticsSavedViewReadEndpointRuntimeState, loadAdminAnalyticsSavedViewReadEndpointModel } from '@/lib/analytics/admin-analytics-saved-view-read-endpoint';
import { savedViewRouteGateStateFromEnv } from '@/lib/analytics/admin-analytics-saved-view-route-plan';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';

export const dynamic = 'force-dynamic';

export default async function SavedViewsPage() {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const isOwner = identity.role === 'owner';
  const actorRole = isOwner ? 'owner' : identity.role === 'staff' ? 'staff' : 'public';
  const readRuntime = buildAdminAnalyticsSavedViewReadEndpointRuntimeState();
  const writeRuntime = savedViewRouteGateStateFromEnv();
  const [products, categories, media, readModel] = await Promise.all([
    listAdminProducts(),
    listAdminCategories(),
    listMedia(),
    loadAdminAnalyticsSavedViewReadEndpointModel({ actorRole })
  ]);
  const surface = buildAdminAnalyticsSavedViewManagementPreview({
    isOwner,
    rows: readModel.rows,
    repositoryReadsEnabled: readModel.repositoryReadsEnabled,
    repositoryWritesEnabled: writeRuntime.metadataChangesEnabled,
    readEndpointEnabled: readRuntime.readEndpointRuntimeEnabled,
    writeEndpointsEnabled: writeRuntime.changeEndpointEnabled,
    rolePolicyEnforced: writeRuntime.rolePolicyEnforced
  });

  return (
    <AdminPageShell
      activeTab="analytics"
      activeNavKey="analytics"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/analytics/saved-views"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Analytics / Saved views</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">Saved dashboard views</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Save, review, and approve dashboard-view metadata without storing analytics rows, customer rows, or export contents.
                Runtime reads and writes remain gated by explicit saved-view flags.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
              Metadata only
            </span>
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">Access mode</p>
            <p className="mt-1 text-sm leading-6 text-amber-950">
              {isOwner
                ? 'Owner session detected. Saved-view write controls are visible, but submit buttons stay locked until write gates are enabled.'
                : 'Staff session detected. Staff can review approved metadata when the read endpoint is enabled; write controls remain owner-only.'}
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
          <h2 className="mt-1 text-xl font-bold text-stone-950">Saved-view runtime gates</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Read endpoint</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.readEndpointEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Repository reads</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.repositoryReadsEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Write endpoints</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.writeEndpointsEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Role policy</dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">{surface.rolePolicyEnforced ? 'Enforced' : 'Pending'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Saved metadata</p>
              <h2 className="mt-1 text-xl font-bold text-stone-950">Approved dashboard views</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Rows appear only when the read endpoint, repository-read gate, generated-client gate, and role policy are enabled.
              </p>
            </div>
            <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-stone-600">
              {surface.rows.length} loaded
            </span>
          </div>
          {surface.rows.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
              No saved views are loaded. Current blockers: {surface.blockers.slice(0, 4).join('; ') || 'none'}.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {surface.rows.map((row) => (
                <article key={row.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-950">{row.label}</h3>
                      <p className="mt-1 text-xs text-stone-500">{row.scope} / {row.audience} / {row.rangeQuery}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-stone-600">
                      {row.activeForOperators ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{row.description ?? 'No description recorded.'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Owner controls</p>
          <h2 className="mt-1 text-xl font-bold text-stone-950">Approved saved-view POST targets</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {surface.controls.map((control) => (
              <article key={control.key} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-stone-950">{control.label}</h3>
                  <span className="rounded-full border border-stone-300 bg-white px-2 py-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-stone-600">
                    {control.enabled ? 'Enabled' : 'Locked'}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600">{control.description}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{control.reason}</p>
                <form action={control.actionPath} method={control.method} className="mt-3 rounded-lg border border-dashed border-stone-300 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Approved POST target</p>
                  <code className="mt-1 block break-all rounded bg-stone-100 px-2 py-1 text-xs text-stone-700">{control.actionPath}</code>
                  <button
                    type="submit"
                    disabled={!control.enabled}
                    aria-disabled={!control.enabled}
                    className="mt-3 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-500"
                  >
                    {control.label}
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
