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

export type CustomerOrderMethodConfirmationKey =
  | 'gateway'
  | 'wallet'
  | 'manualTransfer'
  | 'installment'
  | 'cod';

export type CustomerOrderMethodConfirmation = {
  key: CustomerOrderMethodConfirmationKey;
  title: string;
  body: string;
  methodLabel?: string;
};

type CustomerOrderCopyRegistry = Record<CustomerOrderCopyLocale, Record<CustomerOrderCopyKey, string>>;
type CustomerOrderMethodConfirmationRegistry = Record<CustomerOrderCopyLocale, Record<CustomerOrderMethodConfirmationKey, { title: string; body: string }>>;

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

const customerOrderMethodConfirmationCopy: CustomerOrderMethodConfirmationRegistry = {
  en: {
    gateway: {
      title: 'Online payment selected',
      body: 'Your order is linked to an online gateway payment. We will update the order as soon as provider confirmation is recorded.'
    },
    wallet: {
      title: 'Wallet payment selected',
      body: 'Your order uses your wallet balance. Balance reservation, capture, and later adjustments are shown in your wallet history.'
    },
    manualTransfer: {
      title: 'Manual transfer selected',
      body: 'Keep your bank transfer reference or proof link available. Staff will review the transfer evidence before marking payment complete.'
    },
    installment: {
      title: 'Installment request selected',
      body: 'Your order uses the installment review lane. We will show approval status, follow-up requests, and schedule details here.'
    },
    cod: {
      title: 'Pay on delivery selected',
      body: 'Your order will be collected at delivery. Staff collection status and settlement evidence are tracked with the order.'
    }
  },
  fa: {
    gateway: {
      title: 'پرداخت آنلاین انتخاب شده است',
      body: 'این سفارش به پرداخت آنلاین درگاه متصل است. پس از ثبت تایید ارائه‌دهنده، وضعیت سفارش به‌روزرسانی می‌شود.'
    },
    wallet: {
      title: 'پرداخت با کیف پول انتخاب شده است',
      body: 'این سفارش از موجودی کیف پول شما استفاده می‌کند. رزرو، برداشت و اصلاحات بعدی در تاریخچه کیف پول نمایش داده می‌شود.'
    },
    manualTransfer: {
      title: 'انتقال بانکی انتخاب شده است',
      body: 'شناسه انتقال یا لینک رسید را نگه دارید. تیم پشتیبانی رسید انتقال را پیش از تکمیل پرداخت بررسی می‌کند.'
    },
    installment: {
      title: 'خرید اقساطی انتخاب شده است',
      body: 'این سفارش از مسیر بررسی اقساط استفاده می‌کند. وضعیت تایید، درخواست پیگیری و برنامه پرداخت در اینجا نمایش داده می‌شود.'
    },
    cod: {
      title: 'پرداخت هنگام تحویل انتخاب شده است',
      body: 'مبلغ این سفارش هنگام تحویل دریافت می‌شود. وضعیت دریافت توسط کارکنان و شواهد تسویه همراه سفارش ثبت می‌شود.'
    }
  }
};

export function normalizeCustomerOrderCopyLocale(locale?: string | null): CustomerOrderCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getCustomerOrderCopy(key: CustomerOrderCopyKey, locale?: string | null): string {
  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  return customerOrderCopy[normalizedLocale][key] ?? customerOrderCopy.en[key];
}

export function getCustomerOrderMethodConfirmationCopy(key: CustomerOrderMethodConfirmationKey, locale?: string | null) {
  const normalizedLocale = normalizeCustomerOrderCopyLocale(locale);
  return customerOrderMethodConfirmationCopy[normalizedLocale][key] ?? customerOrderMethodConfirmationCopy.en[key];
}

function metadataText(value: unknown) {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function normalizedMetadataMethodKey(metadata: Record<string, unknown>) {
  return metadataText(metadata.paymentMethodKey)?.toLowerCase();
}

function normalizedMetadataMethodType(metadata: Record<string, unknown>) {
  return metadataText(metadata.paymentMethodType)?.toLowerCase();
}

export function customerOrderMethodConfirmation(
  metadata?: Record<string, unknown> | null,
  locale?: string | null
): CustomerOrderMethodConfirmation | null {
  if (!metadata) return null;

  const methodType = normalizedMetadataMethodType(metadata);
  const methodKey = normalizedMetadataMethodKey(metadata);
  const methodLabel = metadataText(metadata.paymentMethodLabel);
  let key: CustomerOrderMethodConfirmationKey | undefined;

  if (methodType === 'gateway' || methodKey === 'iranian-ipg') key = 'gateway';
  else if (methodType === 'wallet' || methodKey === 'wallet-credit') key = 'wallet';
  else if (methodType === 'manual_transfer' || methodKey === 'bank-transfer') key = 'manualTransfer';
  else if (methodType === 'installment' || methodKey === 'installment-credit') key = 'installment';
  else if (methodType === 'cod' || methodKey === 'cash-on-delivery') key = 'cod';

  if (!key) return null;

  return {
    key,
    methodLabel,
    ...getCustomerOrderMethodConfirmationCopy(key, locale)
  };
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
