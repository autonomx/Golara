import { hasDatabase, prisma } from '@/lib/prisma';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

type AdminModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  body: string;
  items: string[];
  locale?: SupportedLocale | string | null;
};

type VoucherRow = {
  id: string;
  code: string;
  status: string;
  usageCount: number;
  usageLimit: number | null;
  minimumSubtotalCents: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

type EligibilityRuleRow = {
  id: string;
  targetType: string;
  effect: string;
};

type DiscountRow = {
  id: string;
  name: string;
  slug: string;
  discountType: string;
  value: number;
  currency: string;
  status: string;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
  minimumSubtotalCents: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  vouchers: VoucherRow[];
  eligibilityRules: EligibilityRuleRow[];
};

type StoreCreditRow = {
  id: string;
  code: string;
  currency: string;
  initialBalanceCents: number;
  balanceCents: number;
  status: string;
  isActive: boolean;
  expiresAt: Date | null;
};

type PromotionWorkspace = {
  available: boolean;
  discounts: DiscountRow[];
  storeCredits: StoreCreditRow[];
};

function statusClasses(status: string) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'scheduled') return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (status === 'expired') return 'bg-stone-100 text-stone-600 ring-stone-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function formatDate(value: Date | null) {
  if (!value) return 'Open';
  return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

function formatLimit(used: number, limit: number | null) {
  return limit ? `${used}/${limit}` : `${used}/∞`;
}

function formatMoney(value: number | null, currency = 'IRR') {
  if (!value) return 'None';
  return `${currency} ${value.toLocaleString('en-CA')}`;
}

function formatDiscount(discount: DiscountRow) {
  if (discount.discountType === 'percentage') return `${discount.value}%`;
  return formatMoney(discount.value, discount.currency);
}

async function listPromotionWorkspace(): Promise<PromotionWorkspace> {
  if (!hasDatabase()) return { available: false, discounts: [], storeCredits: [] };

  try {
    const [discounts, storeCredits] = await Promise.all([
      prisma.promotionDiscount.findMany({
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        take: 24,
        select: {
          id: true,
          name: true,
          slug: true,
          discountType: true,
          value: true,
          currency: true,
          status: true,
          isActive: true,
          usageCount: true,
          usageLimit: true,
          minimumSubtotalCents: true,
          startsAt: true,
          endsAt: true,
          vouchers: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              code: true,
              status: true,
              usageCount: true,
              usageLimit: true,
              minimumSubtotalCents: true,
              startsAt: true,
              endsAt: true
            }
          },
          eligibilityRules: {
            select: {
              id: true,
              targetType: true,
              effect: true
            }
          }
        }
      }),
      prisma.promotionStoreCredit.findMany({
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        take: 12,
        select: {
          id: true,
          code: true,
          currency: true,
          initialBalanceCents: true,
          balanceCents: true,
          status: true,
          isActive: true,
          expiresAt: true
        }
      })
    ]);

    return { available: true, discounts, storeCredits };
  } catch (error) {
    return { available: false, discounts: [], storeCredits: [] };
  }
}

async function AdminDiscountWorkspace({ eyebrow, title, body, items, locale }: AdminModulePlaceholderProps) {
  const t = createAdminTranslator(locale);
  const workspace = await listPromotionWorkspace();
  const voucherCount = workspace.discounts.reduce((total, discount) => total + discount.vouchers.length, 0);
  const activeCount = workspace.discounts.filter((discount) => discount.status === 'active' && discount.isActive).length;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{body}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
          <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
            <span className="block text-2xl font-black tracking-normal text-stone-950">{workspace.discounts.length}</span>
            {t('Campaigns')}
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
            <span className="block text-2xl font-black tracking-normal text-stone-950">{voucherCount}</span>
            {t('Vouchers')}
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3">
            <span className="block text-2xl font-black tracking-normal text-stone-950">{activeCount}</span>
            {t('Active')}
          </div>
        </div>
      </div>

      {!workspace.available ? (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {t('Promotion tables are not available in this database yet. Run Prisma setup and seed again to show demo discounts.')}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            {item}
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-600">{t('Seeded promotion campaigns')}</h3>
        </div>
        {workspace.discounts.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-white text-left text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-4 py-3">{t('Campaign')}</th>
                  <th className="px-4 py-3">{t('Value')}</th>
                  <th className="px-4 py-3">{t('Vouchers')}</th>
                  <th className="px-4 py-3">{t('Usage')}</th>
                  <th className="px-4 py-3">{t('Window')}</th>
                  <th className="px-4 py-3">{t('Eligibility')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {workspace.discounts.map((discount) => (
                  <tr key={discount.id}>
                    <td className="px-4 py-4 align-top">
                      <div className="font-bold text-rosewood">{discount.name}</div>
                      <div className="mt-1 text-xs text-stone-500">{discount.slug}</div>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClasses(discount.status)}`}>{discount.status}</span>
                    </td>
                    <td className="px-4 py-4 align-top font-semibold text-stone-900">
                      {formatDiscount(discount)}
                      <div className="mt-1 text-xs font-normal text-stone-500">Min {formatMoney(discount.minimumSubtotalCents, discount.currency)}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {discount.vouchers.length ? (
                        <div className="flex flex-wrap gap-2">
                          {discount.vouchers.map((voucher) => (
                            <span key={voucher.id} className="rounded-full border border-rosewood/15 bg-rosewood/5 px-2.5 py-1 text-xs font-bold text-rosewood">{voucher.code}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-stone-700">{formatLimit(discount.usageCount, discount.usageLimit)}</td>
                    <td className="px-4 py-4 align-top text-stone-700">
                      <div>{formatDate(discount.startsAt)}</div>
                      <div className="text-xs text-stone-500">to {formatDate(discount.endsAt)}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-stone-700">
                      {discount.eligibilityRules.length ? `${discount.eligibilityRules.length} rule${discount.eligibilityRules.length === 1 ? '' : 's'}` : 'All products'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-stone-500">No promotion discounts found. Run <code className="rounded bg-stone-100 px-1 py-0.5">npx prisma db seed</code>.</div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-600">{t('Store credits')}</h3>
        </div>
        {workspace.storeCredits.length ? (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {workspace.storeCredits.map((credit) => (
              <div key={credit.id} className="rounded-md border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-rosewood">{credit.code}</p>
                    <p className="mt-1 text-xs text-stone-500">Expires {formatDate(credit.expiresAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClasses(credit.status)}`}>{credit.status}</span>
                </div>
                <div className="mt-4 text-sm text-stone-700">
                  <div>Initial: <strong>{formatMoney(credit.initialBalanceCents, credit.currency)}</strong></div>
                  <div>Balance: <strong>{formatMoney(credit.balanceCents, credit.currency)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-stone-500">No store credits found.</div>
        )}
      </div>
    </section>
  );
}

export async function AdminModulePlaceholder({ eyebrow, title, body, items, locale }: AdminModulePlaceholderProps) {
  if (eyebrow === 'Discounts' || title === 'Promotions workspace') {
    return <AdminDiscountWorkspace eyebrow={eyebrow} title={title} body={body} items={items} locale={locale} />;
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{body}</p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-md border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
