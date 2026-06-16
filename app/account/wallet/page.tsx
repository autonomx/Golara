import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { getCustomerWalletAccountHistory, walletEntryMetadataObject } from '@/lib/checkout/customer-wallet-account-history';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getCustomerCopyDirection } from '@/lib/localization/customer-copy';
import { hasDatabase } from '@/lib/prisma';
import type { CustomerWalletLedgerEntry } from '@/lib/checkout/customer-wallet-ledger';

export const dynamic = 'force-dynamic';

type WalletCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  accountOverview: string;
  unavailableTitle: string;
  unavailableBody: string;
  available: string;
  reserved: string;
  lifetimeCredit: string;
  lifetimeDebit: string;
  history: string;
  emptyTitle: string;
  emptyBody: string;
  order: string;
  reference: string;
  note: string;
  refundReceipt: string;
  refundStatus: string;
  refundPayment: string;
  refundedAt: string;
  idempotencyKey: string;
};

function walletCopy(locale?: string | null): WalletCopy {
  if (locale?.toLowerCase().startsWith('fa')) {
    return {
      eyebrow: 'کیف پول گلارا',
      title: 'کیف پول و اعتبار فروشگاه',
      subtitle: 'اعتبار، پرداخت‌های کیف پول، و بازگشت وجه‌های فروشگاهی خود را در یک نمای امن ببینید.',
      accountOverview: 'بازگشت به حساب کاربری',
      unavailableTitle: 'کیف پول در دسترس نیست',
      unavailableBody: 'برای نمایش تاریخچه کیف پول، پایگاه داده باید فعال باشد.',
      available: 'اعتبار قابل استفاده',
      reserved: 'اعتبار رزرو شده',
      lifetimeCredit: 'کل اعتبار افزوده شده',
      lifetimeDebit: 'کل اعتبار مصرف شده',
      history: 'تاریخچه تراکنش‌ها',
      emptyTitle: 'هنوز تراکنشی ثبت نشده است',
      emptyBody: 'پس از شارژ کیف پول، پرداخت با اعتبار فروشگاه، یا بازگشت وجه، تاریخچه اینجا نمایش داده می‌شود.',
      order: 'سفارش',
      reference: 'شناسه مرجع',
      note: 'یادداشت',
      refundReceipt: 'رسید بازگشت وجه',
      refundStatus: 'وضعیت بازگشت وجه',
      refundPayment: 'شناسه پرداخت',
      refundedAt: 'زمان بازگشت وجه',
      idempotencyKey: 'کلید یکتایی'
    };
  }

  return {
    eyebrow: 'Golara wallet',
    title: 'Wallet and store credit',
    subtitle: 'Review your store-credit balance, wallet payments, and wallet refund history in one secure place.',
    accountOverview: 'Back to account',
    unavailableTitle: 'Wallet is unavailable',
    unavailableBody: 'The database must be enabled before wallet history can be displayed.',
    available: 'Available credit',
    reserved: 'Reserved credit',
    lifetimeCredit: 'Lifetime credits',
    lifetimeDebit: 'Lifetime debits',
    history: 'Transaction history',
    emptyTitle: 'No wallet activity yet',
    emptyBody: 'Wallet credits, store-credit payments, and wallet refunds will appear here once activity is posted.',
    order: 'Order',
    reference: 'Reference',
    note: 'Note',
    refundReceipt: 'Refund receipt',
    refundStatus: 'Refund status',
    refundPayment: 'Payment attempt',
    refundedAt: 'Refunded at',
    idempotencyKey: 'Idempotency key'
  };
}

function formatDate(value: Date, locale?: string | null) {
  return new Intl.DateTimeFormat(locale?.toLowerCase().startsWith('fa') ? 'fa-IR' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function formatOptionalDate(value: unknown, locale?: string | null) {
  if (typeof value !== 'string' && !(value instanceof Date)) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? formatDate(date, locale) : undefined;
}

function entryAmountPrefix(entry: CustomerWalletLedgerEntry) {
  return entry.direction === 'credit' || entry.direction === 'release' ? '+' : '-';
}

function entryTitle(entry: CustomerWalletLedgerEntry) {
  return entry.entryType.replace(/_/g, ' ');
}

function metadataText(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return undefined;
}

function entryReference(entry: CustomerWalletLedgerEntry) {
  const metadata = walletEntryMetadataObject(entry.metadata);
  return metadataText(metadata.orderNumber ?? metadata.paymentAttemptId ?? metadata.source);
}

function walletRefundReceiptDetails(entry: CustomerWalletLedgerEntry, locale?: string | null) {
  if (entry.entryType !== 'refund_credit') return undefined;
  const metadata = walletEntryMetadataObject(entry.metadata);
  return {
    orderNumber: metadataText(metadata.orderNumber ?? entry.orderId),
    paymentAttemptId: metadataText(metadata.paymentAttemptId ?? entry.paymentAttemptId),
    refundedAt: formatOptionalDate(metadata.refundedAt, locale),
    idempotencyKey: metadataText(entry.idempotencyKey),
    status: entry.status.replace(/_/g, ' ')
  };
}

export default async function CustomerWalletPage() {
  if (!hasDatabase()) {
    const storefrontLocale = await resolveStorefrontLocale();
    const dir = getCustomerCopyDirection(storefrontLocale);
    const copy = walletCopy(storefrontLocale);
    return (
      <main id="main-content" tabIndex={-1} dir={dir}>
        <SiteHeader locale={storefrontLocale} />
        <section className="mx-auto max-w-5xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy.eyebrow}</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">{copy.title}</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">{copy.unavailableTitle}</h2>
            <p className="mt-3 text-sm leading-6">{copy.unavailableBody}</p>
          </div>
        </section>
      </main>
    );
  }

  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');

  const locale = session.customer.locale;
  const dir = getCustomerCopyDirection(locale);
  const copy = walletCopy(locale);
  const history = await getCustomerWalletAccountHistory(session.customer.id, 'TOMAN', 50);
  const balance = history.balance;

  return (
    <main id="main-content" tabIndex={-1} dir={dir}>
      <SiteHeader locale={locale} />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy.eyebrow}</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">{copy.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">{copy.subtitle}</p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            {copy.accountOverview}
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <article className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/50">{copy.available}</p>
            <p className="mt-2 font-display text-5xl text-rosewood">{formatMinorUnitAmount(balance?.availableBalanceCents ?? 0, balance?.currency ?? 'TOMAN')}</p>
          </article>
          <article className="rounded-[2rem] border border-rosewood/10 bg-cream p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/50">{copy.reserved}</p>
            <p className="mt-2 font-display text-3xl text-rosewood">{formatMinorUnitAmount(balance?.reservedBalanceCents ?? 0, balance?.currency ?? 'TOMAN')}</p>
          </article>
          <article className="rounded-[2rem] border border-rosewood/10 bg-cream p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/50">{copy.lifetimeCredit}</p>
            <p className="mt-2 font-display text-3xl text-rosewood">{formatMinorUnitAmount(balance?.lifetimeCreditCents ?? 0, balance?.currency ?? 'TOMAN')}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{copy.lifetimeDebit}: {formatMinorUnitAmount(balance?.lifetimeDebitCents ?? 0, balance?.currency ?? 'TOMAN')}</p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-4xl text-rosewood">{copy.history}</h2>
          {history.entries.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-rosewood/10 bg-cream p-6 text-stone-700">
              <h3 className="font-display text-3xl text-rosewood">{copy.emptyTitle}</h3>
              <p className="mt-3 text-sm leading-6">{copy.emptyBody}</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {history.entries.map((entry) => {
                const reference = entryReference(entry);
                const refundReceipt = walletRefundReceiptDetails(entry, locale);
                return (
                  <article key={entry.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/50">{formatDate(entry.createdAt, locale)}</p>
                        <h3 className="mt-2 text-lg font-bold capitalize text-rosewood">{entryTitle(entry)}</h3>
                        <p className="mt-1 text-sm text-stone-600">{entry.status.replace(/_/g, ' ')} · {entry.direction.replace(/_/g, ' ')}</p>
                      </div>
                      <p className="font-display text-3xl text-rosewood">{entryAmountPrefix(entry)}{formatMinorUnitAmount(entry.amountCents, entry.currency)}</p>
                    </div>
                    <div className="mt-4 grid gap-1 text-sm text-stone-700">
                      {entry.orderId ? <p><strong>{copy.order}:</strong> {entry.orderId}</p> : null}
                      {reference ? <p><strong>{copy.reference}:</strong> {reference}</p> : null}
                      {entry.note ? <p><strong>{copy.note}:</strong> {entry.note}</p> : null}
                    </div>
                    {refundReceipt ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                        <p className="font-semibold uppercase tracking-[0.18em] text-emerald-800">{copy.refundReceipt}</p>
                        <div className="mt-3 grid gap-1">
                          <p><strong>{copy.refundStatus}:</strong> {refundReceipt.status}</p>
                          {refundReceipt.orderNumber ? <p><strong>{copy.order}:</strong> {refundReceipt.orderNumber}</p> : null}
                          {refundReceipt.paymentAttemptId ? <p><strong>{copy.refundPayment}:</strong> {refundReceipt.paymentAttemptId}</p> : null}
                          {refundReceipt.refundedAt ? <p><strong>{copy.refundedAt}:</strong> {refundReceipt.refundedAt}</p> : null}
                          {refundReceipt.idempotencyKey ? <p><strong>{copy.idempotencyKey}:</strong> {refundReceipt.idempotencyKey}</p> : null}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
