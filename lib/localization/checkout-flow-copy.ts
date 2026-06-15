export type CheckoutFlowCopyLocale = 'en' | 'fa';

export type CheckoutFlowCopyKey =
  | 'cart-empty'
  | 'cart-missing'
  | 'name-required'
  | 'phone-required'
  | 'city-required'
  | 'address-required'
  | 'delivery-date-invalid'
  | 'delivery-window-invalid'
  | 'payment-method-required'
  | 'payment-method-unavailable'
  | 'database-required'
  | 'failed';

type CheckoutFlowCopyRegistry = Record<CheckoutFlowCopyLocale, Record<CheckoutFlowCopyKey, string>>;

const checkoutFlowCopy: CheckoutFlowCopyRegistry = {
  en: {
    'cart-empty': 'Your cart is empty. Add products before checkout.',
    'cart-missing': 'Your cart session was not found.',
    'name-required': 'Please enter a recipient name.',
    'phone-required': 'Please enter a recipient phone number.',
    'city-required': 'Please enter a delivery city.',
    'address-required': 'Please enter a delivery address.',
    'delivery-date-invalid': 'Please enter a valid delivery date.',
    'delivery-window-invalid': 'Please enter a delivery window like 10:00-12:00.',
    'payment-method-required': 'Please choose a payment method before checkout.',
    'payment-method-unavailable': 'That payment method is no longer available. Please choose another option.',
    'database-required': 'Checkout requires a configured database.',
    failed: 'We could not create checkout. Please try again.'
  },
  fa: {
    'cart-empty': 'سبد خرید شما خالی است. پیش از پرداخت محصول اضافه کنید.',
    'cart-missing': 'نشست سبد خرید شما پیدا نشد.',
    'name-required': 'لطفا نام گیرنده را وارد کنید.',
    'phone-required': 'لطفا شماره تلفن گیرنده را وارد کنید.',
    'city-required': 'لطفا شهر ارسال را وارد کنید.',
    'address-required': 'لطفا نشانی ارسال را وارد کنید.',
    'delivery-date-invalid': 'لطفا تاریخ ارسال معتبر وارد کنید.',
    'delivery-window-invalid': 'لطفا بازه ارسال را مانند 10:00-12:00 وارد کنید.',
    'payment-method-required': 'لطفا پیش از پرداخت یک روش پرداخت انتخاب کنید.',
    'payment-method-unavailable': 'این روش پرداخت دیگر در دسترس نیست. لطفا گزینه دیگری انتخاب کنید.',
    'database-required': 'پرداخت به پایگاه داده پیکربندی‌شده نیاز دارد.',
    failed: 'نتوانستیم پرداخت را ایجاد کنیم. دوباره تلاش کنید.'
  }
};

function normalizeCheckoutFlowLocale(locale?: string | null): CheckoutFlowCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getCheckoutFlowCopy(status?: string | null, locale?: string | null): string | undefined {
  if (!status || !(status in checkoutFlowCopy.en)) return undefined;
  const key = status as CheckoutFlowCopyKey;
  const normalizedLocale = normalizeCheckoutFlowLocale(locale);
  return checkoutFlowCopy[normalizedLocale][key] ?? checkoutFlowCopy.en[key];
}
