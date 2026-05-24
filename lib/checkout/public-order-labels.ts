type LabelLocale = 'en' | 'fa';

type ResultMessage = { title: string; body: string; tone: 'success' | 'warning' };

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

export const resultMessages: Record<string, ResultMessage> = {
  paid: {
    title: 'Payment result received',
    body: 'Thank you. Your order is now marked as paid while staff continue preparing the order.',
    tone: 'success'
  },
  failed: {
    title: 'Payment was not completed',
    body: 'The shop still has your order draft. Staff can help you complete the next step.',
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
    title: 'نتیجه پرداخت دریافت شد',
    body: 'سپاسگزاریم. سفارش شما به عنوان پرداخت‌شده ثبت شد و فروشگاه آماده‌سازی را ادامه می‌دهد.',
    tone: 'success'
  },
  failed: {
    title: 'پرداخت تکمیل نشد',
    body: 'پیش‌نویس سفارش شما نزد فروشگاه باقی می‌ماند. تیم فروشگاه برای مرحله بعدی می‌تواند پیگیری کند.',
    tone: 'warning'
  },
  cancelled: {
    title: 'پرداخت لغو شد',
    body: 'پیش‌نویس سفارش شما همچنان برای پیگیری فروشگاه باقی می‌ماند.',
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

export function resultMessageFor(value: string | undefined, locale?: string) {
  if (!value) return undefined;
  const messages = normalizeLabelLocale(locale) === 'fa' ? resultMessagesFa : resultMessages;
  return messages[value];
}
