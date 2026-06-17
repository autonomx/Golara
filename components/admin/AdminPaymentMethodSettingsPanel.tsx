import { updatePaymentMethodSettingAction } from '@/app/admin/payment-methods/actions';
import {
  buildPaymentMethodReadinessNotes,
  type PaymentMethodSetting
} from '@/lib/settings/payment-method-settings';
import { summarizePaymentMethodReadinessGates } from '@/lib/settings/payment-method-readiness-gate';

export function AdminPaymentMethodSettingsPanel({ methods, databaseReady }: { methods: PaymentMethodSetting[]; databaseReady: boolean }) {
  const readinessSummary = summarizePaymentMethodReadinessGates(methods, { env: process.env });
  const methodsNeedingEvidence = readinessSummary.methods.filter((method) => method.status === 'needs-evidence');

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">DigiKala-style payment methods</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Default enabled payment lanes mirror a DigiKala-style stack: Iranian IPG, wallet/store credit, installment credit, bank transfer, and cash/pay-on-delivery. Private DigiPay APIs are not connected until provider credentials and adapters are added.</p>
      </div>
      {!databaseReady ? <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing the default enabled method stack.</div> : null}
      <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold text-stone-950">Production evidence readiness</p>
            <p className="mt-1 max-w-3xl leading-6">This read-only gate warns owners when enabled methods are missing operational evidence. Checkout remains non-blocking until the launch gate is explicitly enforced.</p>
            <p className="mt-2 max-w-3xl text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Launch checklist: docs/production-payment-gateway-launch-checklist.md · smoke evidence is reviewed per method before sign-off.</p>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-600">non-blocking</span>
        </div>
        <dl className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Enabled</dt><dd className="mt-1 text-lg font-bold text-stone-950">{readinessSummary.enabledMethodCount}</dd></div>
          <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Ready</dt><dd className="mt-1 text-lg font-bold text-emerald-700">{readinessSummary.readyCount}</dd></div>
          <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Needs evidence</dt><dd className="mt-1 text-lg font-bold text-amber-700">{readinessSummary.needsEvidenceCount}</dd></div>
          <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Checkout blocks</dt><dd className="mt-1 text-lg font-bold text-stone-950">{readinessSummary.checkoutBlockingCount}</dd></div>
        </dl>
        {methodsNeedingEvidence.length ? <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900"><p className="font-bold">Enabled methods missing operational evidence</p><ul className="mt-2 grid gap-2">{methodsNeedingEvidence.map((method) => <li key={method.methodKey}><span className="font-semibold">{method.label}</span>: {method.missingEvidence.join(', ')}</li>)}</ul></div> : <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800">All enabled payment methods have the required readiness evidence.</p>}
      </div>
      <div className="mt-6 grid gap-4">
        {methods.map((method) => {
          const notes = buildPaymentMethodReadinessNotes(method, process.env);
          const readinessGate = readinessSummary.methods.find((gate) => gate.methodKey === method.key);
          return (
            <form key={method.key} action={updatePaymentMethodSettingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <input type="hidden" name="key" value={method.key} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{method.label}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{method.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${method.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{method.isActive ? 'enabled' : 'disabled'}</span>
              </div>
              <dl className="grid gap-3 text-sm md:grid-cols-4">
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Type</dt><dd className="mt-1 font-semibold text-stone-900">{method.methodType}</dd></div>
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Provider</dt><dd className="mt-1 font-semibold text-stone-900">{method.providerKey}</dd></div>
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Capture</dt><dd className="mt-1 font-semibold text-stone-900">{method.captureMode}</dd></div>
                <div className="rounded-md border border-stone-200 bg-white p-3"><dt className="font-bold text-stone-500">Settlement</dt><dd className="mt-1 font-semibold text-stone-900">{method.settlementMode}</dd></div>
              </dl>
              {readinessGate?.missingEvidence.length ? <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Missing operational evidence</p><p className="mt-1 leading-6">{readinessGate.missingEvidence.join(', ')}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]">Checkout remains non-blocking</p></div> : null}
              <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 text-sm md:grid-cols-[repeat(3,minmax(0,1fr))_8rem_auto] md:items-end">
                <label className="flex items-center gap-2 font-semibold text-stone-800"><input type="checkbox" name="isActive" defaultChecked={method.isActive} disabled={!databaseReady} className="h-4 w-4 rounded border-stone-300 text-rosewood" />Enabled at checkout</label>
                <label className="flex items-center gap-2 font-semibold text-stone-800"><input type="checkbox" name="isDefault" defaultChecked={method.isDefault} disabled={!databaseReady} className="h-4 w-4 rounded border-stone-300 text-rosewood" />Default method</label>
                <label className="flex items-center gap-2 font-semibold text-stone-800"><input type="checkbox" name="requiresManualReview" defaultChecked={method.requiresManualReview} disabled={!databaseReady} className="h-4 w-4 rounded border-stone-300 text-rosewood" />Manual review</label>
                <label className="grid gap-1 font-semibold text-stone-800">Sort order<input type="number" name="sortOrder" defaultValue={method.sortOrder} min="0" step="1" disabled={!databaseReady} className="rounded-md border border-stone-200 px-3 py-2 text-stone-900" /></label>
                <button type="submit" disabled={!databaseReady} className="rounded-full bg-rosewood px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-rosewood/90 disabled:cursor-not-allowed disabled:bg-stone-300">Save method</button>
              </div>
              {notes.length ? <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-bold">Readiness notes</p><ul className="mt-2 list-disc pl-5">{notes.map((note) => <li key={note}>{note}</li>)}</ul></div> : null}
            </form>
          );
        })}
      </div>
    </section>
  );
}
