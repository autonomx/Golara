export type OrderConfirmationTone = 'success' | 'warning' | 'info';

export type OrderConfirmationResultCopy = {
  eyebrow: string;
  title: string;
  body: string;
  tone: OrderConfirmationTone;
};

export type OrderConfirmationPageCopy = {
  referenceLabel: string;
  privacyNote: string;
  continueShopping: string;
  backHome: string;
};

type OrderConfirmationLocaleKey = 'en' | 'fa';

function confirmationLocaleKey(locale?: string | null): OrderConfirmationLocaleKey {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

const defaultCopy: Record<OrderConfirmationLocaleKey, OrderConfirmationResultCopy> = {
  en: {
    eyebrow: 'Order draft created',
    title: 'Thank you',
    body: 'Your order draft has been sent to the shop. Staff will review availability and follow up with the next step.',
    tone: 'info'
  },
  fa: {
    eyebrow: 'پیش‌نویس سفارش ایجاد شد',
    title: 'سپاسگزاریم',
    body: 'پیش‌نویس سفارش شما برای فروشگاه ارسال شد. تیم فروش موجودی را بررسی می‌کند و مرحله بعدی را پیگیری خواهد کرد.',
    tone: 'info'
  }
};

const resultCopy: Record<OrderConfirmationLocaleKey, Record<string, OrderConfirmationResultCopy>> = {
  en: {
    paid: {
      eyebrow: 'Payment verified',
      title: 'Payment received',
      body: 'Thank you. Your payment result was accepted and the shop can continue preparing your order.',
      tone: 'success'
    },
    failed: {
      eyebrow: 'Payment needs review',
      title: 'Payment was not verified',
      body: 'The shop still has your order draft. The order is not marked paid unless the gateway confirms it.',
      tone: 'warning'
    },
    cancelled: {
      eyebrow: 'Payment cancelled',
      title: 'Checkout was cancelled',
      body: 'Your order draft remains available for staff follow-up if you still want to continue.',
      tone: 'warning'
    },
    'missing-token': {
      eyebrow: 'Order lookup unavailable',
      title: 'We could not open the order status page',
      body: 'The return link did not include a usable public order token. Keep your order reference and contact the shop for help.',
      tone: 'warning'
    }
  },
  fa: {
    paid: {
      eyebrow: 'پرداخت تایید شد',
      title: 'پرداخت دریافت شد',
      body: 'سپاسگزاریم. نتیجه پرداخت شما پذیرفته شد و فروشگاه می‌تواند آماده‌سازی سفارش را ادامه دهد.',
      tone: 'success'
    },
    failed: {
      eyebrow: 'پرداخت نیازمند بررسی است',
      title: 'پرداخت تایید نشد',
      body: 'پیش‌نویس سفارش شما همچنان نزد فروشگاه ثبت است. سفارش فقط زمانی پرداخت‌شده محسوب می‌شود که درگاه آن را تایید کند.',
      tone: 'warning'
    },
    cancelled: {
      eyebrow: 'پرداخت لغو شد',
      title: 'پرداخت لغو شد',
      body: 'اگر همچنان می‌خواهید سفارش را ادامه دهید، پیش‌نویس سفارش برای پیگیری تیم فروش باقی می‌ماند.',
      tone: 'warning'
    },
    'missing-token': {
      eyebrow: 'وضعیت سفارش در دسترس نیست',
      title: 'صفحه وضعیت سفارش باز نشد',
      body: 'پیوند بازگشت شامل توکن عمومی معتبر سفارش نبود. شماره پیگیری سفارش را نگه دارید و برای راهنمایی با فروشگاه تماس بگیرید.',
      tone: 'warning'
    }
  }
};

const pageCopy: Record<OrderConfirmationLocaleKey, OrderConfirmationPageCopy> = {
  en: {
    referenceLabel: 'Reference',
    privacyNote: 'For privacy, this public confirmation page does not show address, customer, or payment details. Keep the reference number for staff follow-up.',
    continueShopping: 'Continue shopping',
    backHome: 'Back home'
  },
  fa: {
    referenceLabel: 'شماره پیگیری',
    privacyNote: 'برای حفظ حریم خصوصی، این صفحه عمومی نشانی، اطلاعات مشتری یا جزئیات پرداخت را نمایش نمی‌دهد. شماره پیگیری را برای پیگیری تیم فروش نگه دارید.',
    continueShopping: 'ادامه خرید',
    backHome: 'بازگشت به خانه'
  }
};

export function orderConfirmationResultCopy(result?: string | null, locale?: string | null): OrderConfirmationResultCopy {
  const normalized = result?.trim().toLowerCase();
  const localeKey = confirmationLocaleKey(locale);
  if (!normalized) return defaultCopy[localeKey];
  return resultCopy[localeKey][normalized] ?? defaultCopy[localeKey];
}

export function orderConfirmationPageCopy(locale?: string | null): OrderConfirmationPageCopy {
  return pageCopy[confirmationLocaleKey(locale)];
}

export function orderConfirmationPanelClass(tone: OrderConfirmationTone) {
  if (tone === 'success') return 'border-olive/20 bg-cream text-olive';
  if (tone === 'warning') return 'border-amber-300 bg-amber-50 text-amber-900';
  return 'border-rosewood/10 bg-white text-stone-700';
}
