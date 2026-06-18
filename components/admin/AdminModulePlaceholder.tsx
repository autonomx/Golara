import { createAdminDiscountAction } from '@/app/admin/discounts/actions';
import { hasDatabase, prisma } from '@/lib/prisma';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey, createAdminTranslator } from '@/lib/localization/admin-copy';
import { createAdminPromotionWorkspaceTranslator } from '@/lib/localization/admin-promotion-workspace-copy';

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

const discountInputClass = 'rounded-lg border border-rosewood/15 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const discountLabelClass = 'grid gap-1.5 text-sm font-semibold text-rosewood';

function statusClasses(status: string) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (status === 'scheduled') return 'bg-blue-50 text-blue-700 ring-blue-200';
  if (status === 'expired') return 'bg-stone-100 text-stone-600 ring-stone-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

function dateLocale(locale?: SupportedLocale | string | null) {
  return adminLocaleKey(locale) === 'fa' ? 'fa-IR' : 'en-CA';
}

function formatDate(value: Date | null, locale?: SupportedLocale | string | null) {
  const pt = createAdminPromotionWorkspaceTranslator(locale);
  if (!value) return pt('Open');
  return new Intl.DateTimeFormat(dateLocale(locale), { month: 'short', day: 'numeric', year: 'numeric' }).format(value);
}

function formatLimit(used: number, limit: number | null) {
  return limit ? `${used}/${limit}` : `${used}/∞`;
}

function formatMoney(value: number | null, currency = 'IRR', locale?: SupportedLocale | string | null) {
  const pt = createAdminPromotionWorkspaceTranslator(locale);
  if (!value) return pt('None');
  return `${currency} ${value.toLocaleString(dateLocale(locale))}`;
}

function formatDiscount(discount: DiscountRow, locale?: SupportedLocale | string | null) {
  if (discount.discountType === 'percentage') return `${discount.value}%`;
  return formatMoney(discount.value, discount.currency, locale);
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

function AdminDiscountCreateForm({ disabled, locale }: { disabled: boolean; locale?: SupportedLocale | string | null }) {
  const t = createAdminTranslator(locale);
  const pt = createAdminPromotionWorkspaceTranslator(locale);

  return (
    <form id="create-discount" action={createAdminDiscountAction} className="mt-6 rounded-lg border border-rosewood/15 bg-rosewood/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-stone-950">{t('Create discount')}</h3>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">
            {t('Create a discount campaign and optionally attach the first voucher code customers can enter at checkout.')}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rosewood ring-1 ring-rosewood/15">{t('Admin only')}</span>
      </div>

      <fieldset disabled={disabled} className="mt-5 grid gap-4 disabled:opacity-60">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className={discountLabelClass}>
            {t('Discount name')}
            <input className={discountInputClass} name="name" placeholder="Summer roses" required />
          </label>
          <label className={discountLabelClass}>
            {t('Slug')}
            <input className={discountInputClass} name="slug" placeholder="summer-roses" />
          </label>
          <label className={discountLabelClass}>
            {t('Currency')}
            <input className={discountInputClass} name="currency" defaultValue="TOMAN" required />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className={discountLabelClass}>
            {t('Discount type')}
            <select className={discountInputClass} name="discountType" defaultValue="percentage" required>
              <option value="percentage">{t('Percentage')}</option>
              <option value="fixed_amount">{t('Fixed amount')}</option>
            </select>
          </label>
          <label className={discountLabelClass}>
            {t('Value')}
            <input className={discountInputClass} name="value" type="number" min="0" step="1" placeholder="10" required />
          </label>
          <label className={discountLabelClass}>
            {t('Status')}
            <select className={discountInputClass} name="status" defaultValue="draft" required>
              <option value="draft">{pt('draft')}</option>
              <option value="active">{pt('active')}</option>
              <option value="paused">{pt('paused')}</option>
              <option value="archived">{pt('archived')}</option>
            </select>
          </label>
          <label className={discountLabelClass}>
            {t('Minimum subtotal')}
            <input className={discountInputClass} name="minimumSubtotalCents" type="number" min="0" step="1" placeholder="500000" />
          </label>
        </div>

        <label className={discountLabelClass}>
          {t('Description')}
          <textarea className={`${discountInputClass} min-h-20`} name="description" placeholder={t('Internal note for staff')} />
        </label>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className={discountLabelClass}>
            {t('Starts at')}
            <input className={discountInputClass} name="startsAt" type="date" />
          </label>
          <label className={discountLabelClass}>
            {t('Ends at')}
            <input className={discountInputClass} name="endsAt" type="date" />
          </label>
          <label className={discountLabelClass}>
            {t('Usage limit')}
            <input className={discountInputClass} name="usageLimit" type="number" min="1" step="1" placeholder="100" />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-rosewood/15 bg-white px-3 py-2 text-sm font-semibold text-rosewood">
            <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-rosewood/30 text-rosewood" />
            {t('Active')}
          </label>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-600">{t('Optional voucher code')}</h4>
          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            <label className={discountLabelClass}>
              {t('Voucher code')}
              <input className={discountInputClass} name="voucherCode" placeholder="SUMMER10" />
            </label>
            <label className={discountLabelClass}>
              {t('Voucher status')}
              <select className={discountInputClass} name="voucherStatus" defaultValue="draft">
                <option value="draft">{pt('draft')}</option>
                <option value="active">{pt('active')}</option>
                <option value="paused">{pt('paused')}</option>
                <option value="archived">{pt('archived')}</option>
              </select>
            </label>
            <label className={discountLabelClass}>
              {t('Voucher usage limit')}
              <input className={discountInputClass} name="voucherUsageLimit" type="number" min="1" step="1" placeholder="100" />
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-rosewood/15 bg-stone-50 px-3 py-2 text-sm font-semibold text-rosewood">
              <input name="voucherIsActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-rosewood/30 text-rosewood" />
              {t('Voucher active')}
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none">
            {t('Create discount')}
          </button>
          {disabled ? <p className="text-sm text-amber-700">{t('Connect the database and sign in as an owner to create discounts.')}</p> : null}
        </div>
      </fieldset>
    </form>
  );
}

async function AdminDiscountWorkspace({ eyebrow, title, body, items, locale }: AdminModulePlaceholderProps) {
  const t = createAdminTranslator(locale);
  const pt = createAdminPromotionWorkspaceTranslator(locale);
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

      <AdminDiscountCreateForm disabled={!workspace.available} locale={locale} />

      <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
        <div className="border-b border-stone-200 bg-stone-50 px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-600">{t('Promotion campaigns')}</h3>
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
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClasses(discount.status)}`}>{pt(discount.status)}</span>
                    </td>
                    <td className="px-4 py-4 align-top font-semibold text-stone-900">
                      {formatDiscount(discount, locale)}
                      <div className="mt-1 text-xs font-normal text-stone-500">{pt('Min')} {formatMoney(discount.minimumSubtotalCents, discount.currency, locale)}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {discount.vouchers.length ? (
                        <div className="flex flex-wrap gap-2">
                          {discount.vouchers.map((voucher) => (
                            <span key={voucher.id} className="rounded-full border border-rosewood/15 bg-rosewood/5 px-2.5 py-1 text-xs font-bold text-rosewood">{voucher.code}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-stone-400">{pt('None')}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-stone-700">{formatLimit(discount.usageCount, discount.usageLimit)}</td>
                    <td className="px-4 py-4 align-top text-stone-700">
                      <div>{formatDate(discount.startsAt, locale)}</div>
                      <div className="text-xs text-stone-500">{pt('to')} {formatDate(discount.endsAt, locale)}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-stone-700">
                      {discount.eligibilityRules.length ? `${discount.eligibilityRules.length} ${pt(discount.eligibilityRules.length === 1 ? 'rule' : 'rules')}` : pt('All products')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-stone-500">{pt('No promotion discounts found. Run seed.')} <code className="rounded bg-stone-100 px-1 py-0.5">npx prisma db seed</code>.</div>
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
                    <p className="mt-1 text-xs text-stone-500">{pt('Expires')} {formatDate(credit.expiresAt, locale)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClasses(credit.status)}`}>{pt(credit.status)}</span>
                </div>
                <div className="mt-4 text-sm text-stone-700">
                  <div>{pt('Initial')}: <strong>{formatMoney(credit.initialBalanceCents, credit.currency, locale)}</strong></div>
                  <div>{pt('Balance')}: <strong>{formatMoney(credit.balanceCents, credit.currency, locale)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-stone-500">{pt('No store credits found.')}</div>
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
