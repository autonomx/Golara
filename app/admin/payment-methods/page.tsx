import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminPaymentMethodSettingsPanel } from '@/components/admin/AdminPaymentMethodSettingsPanel';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminTranslator } from '@/lib/localization/admin-copy';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';
import { paymentMethodSettingsService } from '@/lib/settings/payment-method-settings';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentMethodsPage() {
  const locale = await resolveStorefrontLocale();
  const t = createAdminTranslator(locale);
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [methods, products, categories, media] = await Promise.all([
    authenticated ? paymentMethodSettingsService.list() : Promise.resolve([]),
    listAdminProducts(),
    listAdminCategories(),
    listMedia()
  ]);
  const runtimeReadiness = getRuntimeReadiness();

  return (
    <AdminPageShell
      activeTab="sales"
      activeNavKey="payment-methods"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/payment-methods"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Admin / Payments')}</p>
          <h1 className="mt-1 text-3xl font-bold text-stone-950">{t('Payment methods')}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{t('Configure checkout payment methods independently from provider credentials. Methods can be enabled or disabled here; live online capture still depends on provider adapters and environment configuration.')}</p>
        </div>
        <AdminPaymentMethodSettingsPanel methods={methods} databaseReady={runtimeReadiness.databaseUrlPresent} />
      </div>
    </AdminPageShell>
  );
}
