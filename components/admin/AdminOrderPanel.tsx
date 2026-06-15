import Link from 'next/link';
import { createStaffDraftOrderAction, updateOrderStatusAction } from '@/app/admin/order-actions';
import type { CheckoutOrderSummary } from '@/lib/catalog';
import { formatMinorUnitAmount } from '@/lib/catalog';
import type { AdminOrderFilters, AdminOrderPage } from '@/lib/checkout/admin-order-repository';
import { CHECKOUT_FULFILLMENT_STATUSES, CHECKOUT_ORDER_STATUSES, CHECKOUT_PAYMENT_STATUSES } from '@/lib/checkout/checkout-state-machine';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminFulfillmentQueueTranslator } from '@/lib/localization/admin-fulfillment-copy';

const orderStatuses = [...CHECKOUT_ORDER_STATUSES];
const paymentStatuses = [...CHECKOUT_PAYMENT_STATUSES];
const fulfillmentStatuses = [...CHECKOUT_FULFILLMENT_STATUSES];

type AdminLocale = 'en' | 'fa';
type AdminOrderPanelCopy = {
  any: string;
  updateStatus: string;
  staffNoteOptional: string;
  internalNote: string;
  saveOrder: string;
  eyebrow: string;
  title: string;
  body: string;
  recipient: string;
  customerName: string;
  phone: string;
  currency: string;
  staffNote: string;
  internalContext: string;
  createDraftOrder: string;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  search: string;
  searchPlaceholder: string;
  filterOrders: string;
  clearFilters: string;
  exportCsv: string;
  printView: string;
  showingPage: string;
  of: string;
  orderSingular: string;
  orderPlural: string;
  noFiltered: string;
  noOrders: string;
  created: string;
  order: string;
  customer: string;
  status: string;
  total: string;
  itemSingular: string;
  itemPlural: string;
  latest: string;
  guestDraft: string;
  fulfillment: string;
  payment: string;
  paymentMethod: string;
  manualReview: string;
  provider: string;
  previous: string;
  next: string;
  page: string;
};

const copy: Record<AdminLocale, AdminOrderPanelCopy> = {
  en: {
    any: 'Any',
    updateStatus: 'Update status',
    staffNoteOptional: 'Staff note optional',
    internalNote: 'Internal note',
    saveOrder: 'Save order',
    eyebrow: 'Orders',
    title: 'Checkout order operations',
    body: 'Review checkout orders, page through filtered queues, export or print the current view, update status, and keep staff-only notes.',
    recipient: 'Recipient',
    customerName: 'Customer name',
    phone: 'Phone',
    currency: 'Currency',
    staffNote: 'Staff note',
    internalContext: 'Internal context',
    createDraftOrder: 'Create draft order',
    orderStatus: 'Order status',
    paymentStatus: 'Payment status',
    fulfillmentStatus: 'Fulfillment status',
    search: 'Search',
    searchPlaceholder: 'Order, phone, name, product',
    filterOrders: 'Filter orders',
    clearFilters: 'Clear filters',
    exportCsv: 'Export CSV',
    printView: 'Print view',
    showingPage: 'Showing page',
    of: 'of',
    orderSingular: 'order',
    orderPlural: 'orders',
    noFiltered: 'No checkout orders match the current filters.',
    noOrders: 'No checkout orders found yet. New cart/order draft flows will appear here after they are created.',
    created: 'Created',
    order: 'Order',
    customer: 'Customer',
    status: 'Status',
    total: 'Total',
    itemSingular: 'item',
    itemPlural: 'items',
    latest: 'Latest',
    guestDraft: 'Guest / draft',
    fulfillment: 'Fulfillment',
    payment: 'Payment',
    paymentMethod: 'Payment method',
    manualReview: 'Manual review',
    provider: 'Provider',
    previous: 'Previous',
    next: 'Next',
    page: 'Page'
  },
  fa: {
    any: 'همه',
    updateStatus: 'به‌روزرسانی وضعیت',
    staffNoteOptional: 'یادداشت تیم اختیاری',
    internalNote: 'یادداشت داخلی',
    saveOrder: 'ذخیره سفارش',
    eyebrow: 'سفارش‌ها',
    title: 'عملیات سفارش‌های پرداخت',
    body: 'سفارش‌های پرداخت را بررسی کنید، صف‌های فیلترشده را مرور کنید، نمای فعلی را خروجی بگیرید یا چاپ کنید، وضعیت را به‌روزرسانی کنید و یادداشت‌های داخلی تیم را نگه دارید.',
    recipient: 'گیرنده',
    customerName: 'نام مشتری',
    phone: 'تلفن',
    currency: 'ارز',
    staffNote: 'یادداشت تیم',
    internalContext: 'زمینه داخلی',
    createDraftOrder: 'ایجاد سفارش پیش‌نویس',
    orderStatus: 'وضعیت سفارش',
    paymentStatus: 'وضعیت پرداخت',
    fulfillmentStatus: 'وضعیت اجرا',
    search: 'جستجو',
    searchPlaceholder: 'سفارش، تلفن، نام، محصول',
    filterOrders: 'فیلتر سفارش‌ها',
    clearFilters: 'پاک کردن فیلترها',
    exportCsv: 'خروجی CSV',
    printView: 'چاپ نما',
    showingPage: 'نمایش صفحه',
    of: 'از',
    orderSingular: 'سفارش',
    orderPlural: 'سفارش',
    noFiltered: 'هیچ سفارش پرداختی با فیلترهای فعلی مطابق نیست.',
    noOrders: 'هنوز هیچ سفارش پرداختی پیدا نشده است. سفارش‌های جدید پس از ایجاد در این بخش نمایش داده می‌شوند.',
    created: 'ایجاد شده',
    order: 'سفارش',
    customer: 'مشتری',
    status: 'وضعیت',
    total: 'مجموع',
    itemSingular: 'قلم',
    itemPlural: 'قلم',
    latest: 'آخرین',
    guestDraft: 'مهمان / پیش‌نویس',
    fulfillment: 'اجرا',
    payment: 'پرداخت',
    paymentMethod: 'روش پرداخت',
    manualReview: 'بررسی دستی',
    provider: 'ارائه‌دهنده',
    previous: 'قبلی',
    next: 'بعدی',
    page: 'صفحه'
  }
};

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function formatDate(value: Date, locale?: SupportedLocale | string | null) {
  return new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

const filterInputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const inlineInputClass = 'rounded-xl border border-rosewood/15 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const primaryButtonClass = 'rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30';
const secondaryLinkClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 aria-disabled:opacity-40';

function orderQuery(filters: AdminOrderFilters, page?: number) {
  const params = new URLSearchParams();
  if (filters.status) params.set('orderStatus', filters.status);
  if (filters.paymentStatus) params.set('orderPaymentStatus', filters.paymentStatus);
  if (filters.fulfillmentStatus) params.set('orderFulfillmentStatus', filters.fulfillmentStatus);
  if (filters.search) params.set('orderSearch', filters.search);
  if (page && page > 1) params.set('orderPage', String(page));
  const query = params.toString();
  return query ? `/admin/orders?${query}` : '/admin/orders';
}

function orderExportQuery(filters: AdminOrderFilters, format: 'csv' | 'print') {
  const params = new URLSearchParams();
  if (filters.status) params.set('orderStatus', filters.status);
  if (filters.paymentStatus) params.set('orderPaymentStatus', filters.paymentStatus);
  if (filters.fulfillmentStatus) params.set('orderFulfillmentStatus', filters.fulfillmentStatus);
  if (filters.search) params.set('orderSearch', filters.search);
  return `/admin/orders/${format}?${params.toString()}`;
}

function paymentMethodName(order: CheckoutOrderSummary) {
  return order.latestPaymentMethodLabel || order.latestPaymentMethodKey || order.latestPaymentProvider;
}

function FilterInput({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <input className={filterInputClass} name={name} defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}

function FilterSelect({ label, name, defaultValue, values, anyLabel, formatValue }: { label: string; name: string; defaultValue?: string; values: string[]; anyLabel: string; formatValue: (value: string) => string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <select className={filterInputClass} name={name} defaultValue={defaultValue || ''}>
        <option value="">{anyLabel}</option>
        {values.map((value) => <option key={value} value={value}>{formatValue(value)}</option>)}
      </select>
    </label>
  );
}

function OrderStatusForm({ order, labels, statusLabel }: { order: CheckoutOrderSummary; labels: AdminOrderPanelCopy; statusLabel: (value: string) => string }) {
  const updateAction = updateOrderStatusAction.bind(null, order.id);

  return (
    <form action={updateAction} className="mt-3 grid gap-2 rounded-2xl border border-rosewood/10 bg-cream p-3">
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/60">
        {labels.updateStatus}
        <select name="status" defaultValue={order.status} className={inlineInputClass}>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>{statusLabel(status)}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood/60">
        {labels.staffNoteOptional}
        <input name="staffNotes" className={inlineInputClass} placeholder={labels.internalNote} />
      </label>
      <button className="rounded-full bg-rosewood px-4 py-2 text-xs font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30" type="submit">{labels.saveOrder}</button>
    </form>
  );
}

export async function AdminOrderPanel({ orderPage, filters, locale }: { orderPage: AdminOrderPage; filters: AdminOrderFilters; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const labels = copy[localeKey(activeLocale)];
  const valueLabels = createAdminFulfillmentQueueTranslator(activeLocale);
  const hasFilters = Boolean(filters.status || filters.paymentStatus || filters.fulfillmentStatus || filters.search);
  const orders = orderPage.orders;

  return (
    <section id="orders" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{labels.eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">{labels.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
      </div>

      <form action={createStaffDraftOrderAction} className="mb-6 grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5 md:grid-cols-[1fr_1fr_8rem]">
        <FilterInput label={labels.recipient} name="recipientName" placeholder={labels.customerName} />
        <FilterInput label={labels.phone} name="recipientPhone" placeholder="+1..." />
        <label className="grid gap-2 text-sm font-semibold text-rosewood">
          {labels.currency}
          <input className={filterInputClass} name="currency" defaultValue="TOMAN" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-3">
          {labels.staffNote}
          <input className={filterInputClass} name="staffNotes" placeholder={labels.internalContext} />
        </label>
        <div className="md:col-span-3">
          <button className={primaryButtonClass} type="submit">{labels.createDraftOrder}</button>
        </div>
      </form>

      <form className="mb-6 grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5 md:grid-cols-4" action="/admin/orders">
        <FilterSelect label={labels.orderStatus} name="orderStatus" defaultValue={filters.status} values={orderStatuses} anyLabel={labels.any} formatValue={valueLabels.orderStatus} />
        <FilterSelect label={labels.paymentStatus} name="orderPaymentStatus" defaultValue={filters.paymentStatus} values={paymentStatuses} anyLabel={labels.any} formatValue={valueLabels.paymentStatus} />
        <FilterSelect label={labels.fulfillmentStatus} name="orderFulfillmentStatus" defaultValue={filters.fulfillmentStatus} values={fulfillmentStatuses} anyLabel={labels.any} formatValue={valueLabels.fulfillmentStatus} />
        <FilterInput label={labels.search} name="orderSearch" defaultValue={filters.search} placeholder={labels.searchPlaceholder} />
        <div className="flex flex-wrap gap-3 md:col-span-4">
          <button className={primaryButtonClass} type="submit">{labels.filterOrders}</button>
          {hasFilters ? <a className={secondaryLinkClass} href="/admin/orders">{labels.clearFilters}</a> : null}
          <a className={secondaryLinkClass} href={orderExportQuery(filters, 'csv')}>{labels.exportCsv}</a>
          <a className={secondaryLinkClass} href={orderExportQuery(filters, 'print')}>{labels.printView}</a>
        </div>
      </form>

      <div className="mb-4 text-sm text-stone-600">
        {labels.showingPage} {orderPage.page} {labels.of} {orderPage.totalPages} · {orderPage.totalCount} {orderPage.totalCount === 1 ? labels.orderSingular : labels.orderPlural}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-rosewood/10 bg-cream p-5 text-sm text-stone-700">
          {hasFilters ? labels.noFiltered : labels.noOrders}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rosewood/10">
          <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60">
              <tr>
                <th className="px-4 py-3 font-semibold">{labels.created}</th>
                <th className="px-4 py-3 font-semibold">{labels.order}</th>
                <th className="px-4 py-3 font-semibold">{labels.customer}</th>
                <th className="px-4 py-3 font-semibold">{labels.status}</th>
                <th className="px-4 py-3 font-semibold">{labels.paymentMethod}</th>
                <th className="px-4 py-3 font-semibold">{labels.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
              {orders.map((order) => {
                const methodName = paymentMethodName(order);
                return (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">{formatDate(order.createdAt, activeLocale)}</td>
                    <td className="px-4 py-3 align-top">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-rosewood underline decoration-rosewood/30 underline-offset-4 outline-none transition hover:decoration-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-stone-500">{order.itemCount} {order.itemCount === 1 ? labels.itemSingular : labels.itemPlural} · {valueLabels.checkoutMode(order.checkoutMode)}</p>
                      {order.latestTimelineTitle ? <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-xs text-stone-600">{labels.latest}: {order.latestTimelineTitle}</p> : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-stone-700">{order.customerName || labels.guestDraft}</p>
                      {order.customerPhone ? <p className="text-xs text-stone-500">{order.customerPhone}</p> : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full border border-rosewood/15 bg-cream px-3 py-1 text-xs font-semibold text-rosewood">
                        {valueLabels.orderStatus(order.status)}
                      </span>
                      {order.fulfillmentStatus ? <p className="mt-1 text-xs text-stone-500">{labels.fulfillment}: {valueLabels.fulfillmentStatus(order.fulfillmentStatus)}</p> : null}
                      {order.latestPaymentStatus ? <p className="mt-1 text-xs text-stone-500">{labels.payment}: {valueLabels.paymentStatus(order.latestPaymentStatus)}</p> : null}
                      <OrderStatusForm order={order} labels={labels} statusLabel={valueLabels.orderStatus} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {methodName ? <p className="font-semibold text-stone-700">{methodName}</p> : <p className="text-xs text-stone-400">—</p>}
                      {order.latestPaymentProvider ? <p className="mt-1 text-xs text-stone-500">{labels.provider}: {order.latestPaymentProvider}</p> : null}
                      {order.latestPaymentRequiresManualReview ? <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">{labels.manualReview}</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-semibold text-rosewood">
                      {formatMinorUnitAmount(order.totalCents, order.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {orderPage.totalPages > 1 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <a className={secondaryLinkClass} href={orderQuery(filters, Math.max(1, orderPage.page - 1))} aria-disabled={orderPage.page <= 1}>{labels.previous}</a>
          <span className="text-sm text-stone-600">{labels.page} {orderPage.page} {labels.of} {orderPage.totalPages}</span>
          <a className={secondaryLinkClass} href={orderQuery(filters, Math.min(orderPage.totalPages, orderPage.page + 1))} aria-disabled={orderPage.page >= orderPage.totalPages}>{labels.next}</a>
        </div>
      ) : null}
    </section>
  );
}
