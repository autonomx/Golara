import { AdminPaymentMethodSettingsPanel } from '@/components/admin/AdminPaymentMethodSettingsPanel';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';
import { paymentMethodSettingsService } from '@/lib/settings/payment-method-settings';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentMethodsPage() {
  await requireAdminRouteSession();

  const methods = await paymentMethodSettingsService.list();
  const runtimeReadiness = getRuntimeReadiness();

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Payments</p>
          <h1 className="mt-1 text-3xl font-bold text-stone-950">Payment methods</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure the DigiKala-style payment method stack independently from provider credentials. Methods can be enabled or disabled here; live online capture still depends on provider adapters and environment configuration.</p>
        </div>
        <AdminPaymentMethodSettingsPanel methods={methods} databaseReady={runtimeReadiness.databaseUrlPresent} />
      </div>
    </main>
  );
}
