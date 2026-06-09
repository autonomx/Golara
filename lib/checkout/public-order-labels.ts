type LabelLocale = 'en' | 'fa';

type ResultMessage = { title: string; body: string; tone: 'success' | 'warning' };

type PublicOrderCopy = {
  eyebrow: string;
  introPrefix: string;
  introSuffix: string;
  total: string;
  orderMode: string;
  fulfillment: string;
  created: string;
  deliveryTiming: string;
  date: string;
  window: string;
  notSetYet: string;
  items: string;
  progress: string;
  noProgress: string;
  privacy: string;
  latestPaymentStatus: string;
  paymentGuidance: string;
  languageNavLabel: string;
  languageCurrentPrefix: string;
  languageEnglish: string;
  languagePersian: string;
  viewInEnglish: string;
  viewInPersian: string;
};

type PaymentGuidance = {
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'info';
};

export const orderStatusLabels: Record<string, string> = {
  draft: 'Received by the shop',
  pending_payment: 'Waiting for payment or staff confirmation',
  paid: 'Payment received',
  preparing: 'Being prepared',
  out_for_delivery: 'Out for delivery',
  fulfilled: 'Completed',
  cancelled: 'Cancelled'
};

export const fulfillmentStatusLabels: Record<string, string> = {
  not_scheduled: 'Not scheduled yet',
  scheduled: 'Scheduled',
  preparing: 'Being prepared',
  ready_for_delivery: 'Ready for delivery',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  issue: 'Needs staff review'
};

export const paymentStatusLabels: Record<string, string> = {
  manual_pending: 'Manual staff follow-up pending',
  created: 'Payment request created',
  redirect_required: 'Waiting for gateway payment',
  verified_paid: 'Payment verified',
  failed: 'Payment failed or was not verified',
  cancelled: 'Payment cancelled'
};

export const orderStatusLabelsFa: Record<string, string> = {
  draft: 'دریافت شده توسط فروشگاه',
  pending_payment: 'در انتظار پرداخت یا تایید فروشگاه',
  paid: 'پرداخت دریافت شد',
  preparing: 'در حال آماده‌سازی',
  out_for_delivery: 'در مسیر ارسال',
  fulfilled: 'تکمیل شده',
  cancelled: 'لغو شده'
};

export const fulfillmentStatusLabelsFa: Record<string, string> = {
  not_scheduled: 'هنوز زمان‌بندی نشده',
  scheduled: 'زمان‌بندی شده',
  preparing: 'در حال آماده‌سازی',
  ready_for_delivery: 'آماده ارسال',
  out_for_delivery: 'در مسیر ارسال',
  delivered: 'تحویل داده شده',
  issue: 'نیازمند بررسی فروشگاه'
};

export const paymentStatusLabelsFa: Record<string, string> = {
  manual_pending: 'در انتظار پیگیری فروشگاه',
  created: 'درخواست پرداخت ایجاد شد',
  redirect_required: 'در انتظار پرداخت در درگاه',
  verified_paid: 'پرداخت تایید شد',
  failed: 'پرداخت ناموفق بود یا تایید نشد',
  cancelled: 'پرداخت لغو شد'
};

export const publicOrderCopy: PublicOrderCopy = {
  eyebrow: 'Order status',
  introPrefix: 'Your order is currently',
  introSuffix: 'Staff will follow up if more information is needed.',
  total: 'Total',
  orderMode: 'Order mode',
  fulfillment: 'Fulfillment',
  created: 'Created',
  deliveryTiming: 'Delivery timing',
  date: 'Date',
  window: 'Window',
  notSetYet: 'Not set yet',
  items: 'Items',
  progress: 'Progress',
  noProgress: 'No progress updates have been posted yet.',
  privacy: 'For privacy, this page does not show address, phone, courier details, customer notes, or staff-only notes. Contact the shop with your order reference for detailed changes.',
  latestPaymentStatus: 'Latest payment status',
  paymentGuidance: 'Payment guidance',
  languageNavLabel: 'Order status language',
  languageCurrentPrefix: 'Current language',
  languageEnglish: 'English',
  languagePersian: 'Persian',
  viewInEnglish: 'View this order status in English',
  viewInPersian: 'View this order status in Persian'
};

export const publicOrderCopyFa: PublicOrderCopy = {
  eyebrow: 'وضعیت سفارش',
  introPrefix: 'وضعیت فعلی سفارش شما',
  introSuffix: 'در صورت نیاز، فروشگاه برای اطلاعات بیشتر پیگیری می‌کند.',
  total: 'مبلغ کل',
  orderMode: 'نوع سفارش',
  fulfillment: 'آماده‌سازی و ارسال',
  created: 'ثبت شده در',
  deliveryTiming: 'زمان تحویل',
  date: 'تاریخ',
  window: 'بازه زمانی',
  notSetYet: 'هنوز مشخص نشده',
  items: 'آیتم‌ها',
  progress: 'روند سفارش',
  noProgress: 'هنوز به‌روزرسانی جدیدی برای این سفارش ثبت نشده است.',
  privacy: 'برای حفظ حریم خصوصی، این صفحه آدرس، تلفن، اطلاعات پیک، یادداشت مشتری یا یادداشت‌های داخلی فروشگاه را نمایش نمی‌دهد. برای تغییرات دقیق‌تر، با شماره سفارش با فروشگاه تماس بگیرید.',
  latestPaymentStatus: 'آخرین وضعیت پرداخت',
  paymentGuidance: 'راهنمای پرداخت',
  languageNavLabel: 'زبان وضعیت سفارش',
  languageCurrentPrefix: 'زبان فعلی',
  languageEnglish: 'انگلیسی',
  languagePersian: 'فارسی',
  viewInEnglish: 'مشاهده وضعیت این سفارش به انگلیسی',
  viewInPersian: 'مشاهده وضعیت این سفارش به فارسی'
};

export const resultMessages: Record<string, ResultMessage> = {
  paid: {
    title: 'Payment verified',
    body: 'Thank you. The gateway result was verified and your order is marked as paid while staff continue preparing it.',
    tone: 'success'
  },
  failed: {
    title: 'Payment was not verified',
    body: 'The shop still has your order draft. You can retry with staff help; the order is not marked paid unless the gateway confirms it.',
    tone: 'warning'
  },
  cancelled: {
    title: 'Payment was cancelled',
    body: 'Your order draft remains available for staff follow-up if you still want to continue.',
    tone: 'warning'
  }
};

export const resultMessagesFa: Record<string, ResultMessage> = {
  paid: {
    title: 'پرداخت تایید شد',
    body: 'سپاسگزاریم. نتیجه درگاه تایید شد و سفارش شما به عنوان پرداخت‌شده ثبت شد؛ فروشگاه آماده‌سازی را ادامه می‌دهد.',
    tone: 'success'
  },
  failed: {
    title: 'پرداخت تایید نشد',
    body: 'پیش‌نویس سفارش شما نزد فروشگاه باقی می‌ماند. سفارش فقط پس از تایید درگاه به عنوان پرداخت‌شده ثبت می‌شود.',
    tone: 'warning'
  },
  cancelled: {
    title: 'پرداخت لغو شد',
    body: 'پیش‌نویس سفارش شما همچنان برای پیگیری فروشگاه باقی می‌ماند.',
    tone: 'warning'
  }
};

export const paymentGuidance: Record<string, PaymentGuidance> = {
  manual_pending: {
    title: 'Staff will confirm payment manually',
    body: 'This order may need a manual payment step or staff confirmation. Keep your order reference and contact the shop if you need help.',
    tone: 'info'
  },
  redirect_required: {
    title: 'Payment is waiting at the gateway',
    body: 'If you left the payment page before completing it, the order remains pending until the gateway confirms payment or staff follows up.',
    tone: 'info'
  },
  verified_paid: {
    title: 'Gateway payment verified',
    body: 'Your payment has been verified. Staff can now continue fulfillment and delivery preparation.',
    tone: 'success'
  },
  failed: {
    title: 'Payment needs attention',
    body: 'The gateway did not verify this payment. Staff can help retry or complete the order another way.',
    tone: 'warning'
  },
  cancelled: {
    title: 'Payment was cancelled',
    body: 'The order has not been marked paid. Staff can help if you want to continue with this order.',
    tone: 'warning'
  }
};

export const paymentGuidanceFa: Record<string, PaymentGuidance> = {
  manual_pending: {
    title: 'فروشگاه پرداخت را دستی بررسی می‌کند',
    body: 'این سفارش ممکن است نیازمند پرداخت دستی یا تایید فروشگاه باشد. شماره سفارش را نگه دارید و در صورت نیاز با فروشگاه تماس بگیرید.',
    tone: 'info'
  },
  redirect_required: {
    title: 'پرداخت در انتظار درگاه است',
    body: 'اگر صفحه پرداخت را قبل از تکمیل ترک کرده‌اید، سفارش تا زمان تایید درگاه یا پیگیری فروشگاه در انتظار می‌ماند.',
    tone: 'info'
  },
  verified_paid: {
    title: 'پرداخت درگاه تایید شد',
    body: 'پرداخت شما تایید شده است. فروشگاه آماده‌سازی و ارسال را ادامه می‌دهد.',
    tone: 'success'
  },
  failed: {
    title: 'پرداخت نیازمند پیگیری است',
    body: 'درگاه این پرداخت را تایید نکرد. فروشگاه می‌تواند برای تلاش دوباره یا روش دیگر پرداخت کمک کند.',
    tone: 'warning'
  },
  cancelled: {
    title: 'پرداخت لغو شد',
    body: 'این سفارش به عنوان پرداخت‌شده ثبت نشده است. اگر می‌خواهید ادامه دهید، فروشگاه می‌تواند کمک کند.',
    tone: 'warning'
  }
};

export function normalizeLabelLocale(locale?: string): LabelLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function labelFor(map: Record<string, string>, value: string) {
  return map[value] || value.replace(/_/g, ' ');
}

export function orderStatusLabel(value: string, locale?: string) {
  return labelFor(normalizeLabelLocale(locale) === 'fa' ? orderStatusLabelsFa : orderStatusLabels, value);
}

export function fulfillmentStatusLabel(value: string, locale?: string) {
  return labelFor(normalizeLabelLocale(locale) === 'fa' ? fulfillmentStatusLabelsFa : fulfillmentStatusLabels, value);
}

export function paymentStatusLabel(value: string, locale?: string) {
  return labelFor(normalizeLabelLocale(locale) === 'fa' ? paymentStatusLabelsFa : paymentStatusLabels, value);
}

export function resultMessageFor(value: string | undefined, locale?: string) {
  if (!value) return undefined;
  const messages = normalizeLabelLocale(locale) === 'fa' ? resultMessagesFa : resultMessages;
  return messages[value];
}

export function paymentGuidanceFor(value: string | undefined, locale?: string) {
  if (!value) return undefined;
  const messages = normalizeLabelLocale(locale) === 'fa' ? paymentGuidanceFa : paymentGuidance;
  return messages[value];
}

export function publicOrderCopyFor(locale?: string) {
  return normalizeLabelLocale(locale) === 'fa' ? publicOrderCopyFa : publicOrderCopy;
}
