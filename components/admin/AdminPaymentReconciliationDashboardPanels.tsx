import type {
  CodCollectionSettlementTotals,
  InstallmentReceivablesSummary,
  ManualTransferSettlementTotals,
  MethodSettlementSummary,
  WalletLiabilityBalance
} from '@/lib/checkout/payment-method-settlement-summary';

type AdminPaymentReconciliationDashboardPanelsProps = {
  methodSummaries: MethodSettlementSummary[];
  manualTransferTotals: ManualTransferSettlementTotals;
  walletLiability: WalletLiabilityBalance;
  codCollectionTotals: CodCollectionSettlementTotals;
  installmentReceivables: InstallmentReceivablesSummary;
  csvHref?: string;
};

function formatMoney(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatList(values: string[]) {
  return values.length ? values.join(', ') : '—';
}

function statCard(label: string, value: string | number, detail?: string) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
      {detail ? <p className="mt-1 text-xs text-stone-500">{detail}</p> : null}
    </div>
  );
}

export function AdminPaymentReconciliationDashboardPanels({
  methodSummaries,
  manualTransferTotals,
  walletLiability,
  codCollectionTotals,
  installmentReceivables,
  csvHref = '/admin/payments/reconciliation/csv'
}: AdminPaymentReconciliationDashboardPanelsProps) {
  const topMethodSummaries = methodSummaries.slice(0, 6);

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settlement dashboard</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Payment method reconciliation panels</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Read-only rollups for method-level settlement, manual transfers, wallet liability, COD collection, and installment receivables.
          </p>
        </div>
        <a href={csvHref} className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">
          Download reconciliation CSV
        </a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {statCard('Methods', methodSummaries.length, 'Grouped by selected payment method')}
        {statCard('Manual received', formatMoney(manualTransferTotals.receivedTotalCents, manualTransferTotals.currency), `${manualTransferTotals.pendingReviewCount} pending review`)}
        {statCard('Wallet liability', formatMoney(walletLiability.totalLiabilityCents, walletLiability.currency), `${walletLiability.walletCount} wallets`)}
        {statCard('COD collected', formatMoney(codCollectionTotals.collectedTotalCents, codCollectionTotals.currency), `${codCollectionTotals.pendingCollectionCount} pending collection`)}
        {statCard('Installment due', formatMoney(installmentReceivables.remainingTotalCents, installmentReceivables.currency), `${installmentReceivables.overdueCount} overdue entries`)}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">Method-level settlement</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-stone-200">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">Orders</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {topMethodSummaries.length ? topMethodSummaries.map((summary) => (
                  <tr key={`${summary.methodKey}-${summary.provider}-${summary.currency}`}>
                    <td className="px-3 py-2 font-semibold text-stone-900">{summary.methodLabel}</td>
                    <td className="px-3 py-2 text-stone-700">{summary.orderCount}</td>
                    <td className="px-3 py-2 text-stone-700">{formatMoney(summary.paidTotalCents, summary.currency)}</td>
                    <td className="px-3 py-2 text-stone-700">{formatMoney(summary.outstandingTotalCents, summary.currency)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-stone-500">No method settlement rows are available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-lg border border-stone-200 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">Manual transfer totals</h3>
            <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div><dt className="font-semibold text-stone-950">Methods</dt><dd>{formatList(manualTransferTotals.methodKeys)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Received</dt><dd>{formatMoney(manualTransferTotals.receivedTotalCents, manualTransferTotals.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Pending review</dt><dd>{formatMoney(manualTransferTotals.pendingReviewTotalCents, manualTransferTotals.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Needs follow-up</dt><dd>{formatMoney(manualTransferTotals.needsFollowUpTotalCents, manualTransferTotals.currency)}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-stone-200 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">Wallet liability balance</h3>
            <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div><dt className="font-semibold text-stone-950">Available</dt><dd>{formatMoney(walletLiability.availableLiabilityCents, walletLiability.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Reserved</dt><dd>{formatMoney(walletLiability.reservedLiabilityCents, walletLiability.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Ledger entries</dt><dd>{walletLiability.ledgerEntryCount}</dd></div>
              <div><dt className="font-semibold text-stone-950">Wallet captures</dt><dd>{formatMoney(walletLiability.walletCapturedTotalCents, walletLiability.currency)}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-stone-200 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">COD collection totals</h3>
            <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div><dt className="font-semibold text-stone-950">Collected</dt><dd>{formatMoney(codCollectionTotals.collectedTotalCents, codCollectionTotals.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Pending</dt><dd>{formatMoney(codCollectionTotals.pendingCollectionTotalCents, codCollectionTotals.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Waived</dt><dd>{formatMoney(codCollectionTotals.waivedCollectionTotalCents, codCollectionTotals.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Adjustment evidence</dt><dd>{codCollectionTotals.ownerAdjustmentEvidenceCount}</dd></div>
            </dl>
          </div>

          <div className="rounded-lg border border-stone-200 p-4">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">Installment receivables</h3>
            <dl className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
              <div><dt className="font-semibold text-stone-950">Plans</dt><dd>{installmentReceivables.planIds.length}</dd></div>
              <div><dt className="font-semibold text-stone-950">Remaining</dt><dd>{formatMoney(installmentReceivables.remainingTotalCents, installmentReceivables.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Overdue</dt><dd>{formatMoney(installmentReceivables.overdueTotalCents, installmentReceivables.currency)}</dd></div>
              <div><dt className="font-semibold text-stone-950">Next due</dt><dd>{installmentReceivables.nextDueAt ?? '—'}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
