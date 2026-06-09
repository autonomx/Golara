export type CustomerOrderCopyLocale = 'en' | 'fa';

export type CustomerOrderCopyKey =
  | 'eyebrow'
  | 'title'
  | 'subtitle'
  | 'unavailableTitle'
  | 'unavailableBody'
  | 'accountOverview'
  | 'emptyTitle'
  | 'emptyBody'
  | 'browseProducts'
  | 'viewPublicStatus'
  | 'itemSingular'
  | 'itemPlural'
  | 'moreItemSingular'
  | 'moreItemPlural'
  | 'payment.none'
  | 'payment.verifiedPaid'
  | 'payment.redirectRequired'
  | 'payment.manualPending'
  | 'payment.failed'
  | 'payment.cancelled';

type CustomerOrderCopyRegistry = Record<CustomerOrderCopyLocale, Record<CustomerOrderCopyKey, string>>;

const customerOrderCopy: CustomerOrderCopyRegistry = {
  en: {
    eyebrow: 'Order history',
    title: 'Your orders',
    subtitle: 'Review orders connected to your signed-in customer profile. Public order pages still use privacy-safe lookup tokens.',
    unavailableTitle: 'Order history unavailable',
    unavailableBody: 'Customer order history requires a configured database.',
    accountOverview: 'Account overview',
    emptyTitle: 'No orders yet.',
    emptyBody: 'Orders created while signed in will appear here.',
    browseProducts: 'Browse products',
    viewPublicStatus: 'View public status',
    itemSingular: 'item',
    itemPlural: 'items',
    moreItemSingular: 'more item',
    moreItemPlural: 'more items',
    'payment.none': 'No payment attempt yet',
    'payment.verifiedPaid': 'Payment verified',
    'payment.redirectRequired': 'Waiting for gateway payment',
    'payment.manualPending': 'Manual follow-up pending',
    'payment.failed': 'Payment failed',
    'payment.cancelled': 'Payment cancelled'
  },
  fa: {
    eyebrow: 'تاریخچه سفارش‌ها',
    title: 'سفارش‌های شما',
    subtitle: 'سفارش‌های متصل به پروفایل مشتری واردشده خود را مرور کنید. صفحه‌های عمومی سفارش همچنان از شناسه‌های امن و خصوصی استفاده می‌کنند.',
    unavailableTitle: 'تاریخچه سفارش‌ها در دسترس نیست',
    unavailableBody: 'تاریخچه سفارش‌های مشتری به پایگاه داده پیکربندی‌شده نیاز دارد.',
    accountOverview: 'نمای کلی حساب',
    emptyTitle: 'هنوز سفارشی ندارید.',
    emptyBody: 'سفارش‌هایی که هنگام ورود ایجاد شوند، اینجا نمایش داده می‌شوند.',
    browseProducts: 'مشاهده محصولات',
    viewPublicStatus: 'مشاهده وضعیت عمومی',
    itemSingular: 'قلم',
    itemPlural: 'قلم',
    moreItemSingular: 'قلم دیگر',
    moreItemPlural: 'قلم دیگر',
    'payment.none': 'هنوز تلاش پرداختی ثبت نشده است',
    'payment.verifiedPaid': 'پرداخت تایید شد',
    'payment.redirectRequired': 'در انتظار پرداخت در درگاه',
    'payment.manualPending': 'پیگیری دستی در انتظار است',
    'payment.failed': 'پرداخت ناموفق بود',
    'payment.cancelled': 'پرداخت لغو شد'
  }
};

export function normalizeCustomerOrderCopyLocale(locale?: string | null): CustomerOrderCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getCustomerOrderCopy(key: CustomerOrderCopyKey, locale?: string | null): string {
  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  return customerOrderCopy[normalizedLocale][key] ?? customerOrderCopy.en[key];
}

export function customerOrderDateLocale(locale?: string | null): string {
  return normalizeCustomerOrderCopyLocale(locale) === 'fa' ? 'fa-IR' : 'en-CA';
}

export function customerOrderPaymentSummary(status?: string | null, locale?: string | null): string {
  if (!status) return getCustomerOrderCopy('payment.none', locale);
  if (status === 'verified_paid') return getCustomerOrderCopy('payment.verifiedPaid', locale);
  if (status === 'redirect_required') return getCustomerOrderCopy('payment.redirectRequired', locale);
  if (status === 'manual_pending') return getCustomerOrderCopy('payment.manualPending', locale);
  if (status === 'failed') return getCustomerOrderCopy('payment.failed', locale);
  if (status === 'cancelled') return getCustomerOrderCopy('payment.cancelled', locale);
  return status.replace(/_/g, ' ');
}

export function customerOrderItemCountLabel(count: number, locale?: string | null): string {
  const key = count === 1 ? 'itemSingular' : 'itemPlural';
  return `${count} ${getCustomerOrderCopy(key, locale)}`;
}

export function customerOrderMoreItemLabel(count: number, locale?: string | null): string {
  const key = count === 1 ? 'moreItemSingular' : 'moreItemPlural';
  return `${count} ${getCustomerOrderCopy(key, locale)}`;
}
