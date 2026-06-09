import type { FulfillmentQueueOrder } from '@/lib/analytics/fulfillment-queue-summary';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey, type AdminLocaleKey } from '@/lib/localization/admin-copy';

type FulfillmentPriority = FulfillmentQueueOrder['priority'];

type FulfillmentQueueValueCopy = {
  fallbackUnknown: string;
  guestCheckout: string;
  orderStatuses: Record<string, string>;
  fulfillmentStatuses: Record<string, string>;
  checkoutModes: Record<string, string>;
  priorities: Record<FulfillmentPriority, string>;
};

const copy: Record<AdminLocaleKey, FulfillmentQueueValueCopy> = {
  en: {
    fallbackUnknown: 'Unknown',
    guestCheckout: 'Guest checkout',
    orderStatuses: {
      unknown: 'Unknown',
      pending: 'Pending',
      confirmed: 'Confirmed',
      paid: 'Paid',
      processing: 'Processing',
      fulfilled: 'Fulfilled',
      complete: 'Complete',
      completed: 'Completed',
      cancelled: 'Cancelled',
      canceled: 'Canceled',
      refunded: 'Refunded',
      voided: 'Voided'
    },
    fulfillmentStatuses: {
      unfulfilled: 'Unfulfilled',
      pending: 'Pending',
      new: 'New',
      created: 'Created',
      processing: 'Processing',
      packing: 'Packing',
      packed: 'Packed',
      in_progress: 'In progress',
      in_transit: 'In transit',
      ready: 'Ready',
      ready_for_pickup: 'Ready for pickup',
      scheduled: 'Scheduled',
      fulfilled: 'Fulfilled',
      delivered: 'Delivered',
      complete: 'Complete',
      completed: 'Completed',
      cancelled: 'Cancelled',
      canceled: 'Canceled'
    },
    checkoutModes: {
      delivery: 'Delivery',
      local_delivery: 'Local delivery',
      courier: 'Courier',
      pickup: 'Pickup',
      pickup_only: 'Pickup',
      shipping: 'Shipping',
      in_store: 'In-store',
      manual: 'Manual',
      quote: 'Quote',
      online: 'Online',
      card: 'Card',
      cash: 'Cash',
      unknown: 'Unknown'
    },
    priorities: {
      overdue: 'Overdue',
      today: 'New today',
      normal: 'Normal'
    }
  },
  fa: {
    fallbackUnknown: 'نامشخص',
    guestCheckout: 'پرداخت مهمان',
    orderStatuses: {
      unknown: 'نامشخص',
      pending: 'در انتظار',
      confirmed: 'تأیید شده',
      paid: 'پرداخت شده',
      processing: 'در حال پردازش',
      fulfilled: 'انجام شده',
      complete: 'کامل',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده',
      canceled: 'لغو شده',
      refunded: 'مسترد شده',
      voided: 'باطل شده'
    },
    fulfillmentStatuses: {
      unfulfilled: 'انجام نشده',
      pending: 'در انتظار',
      new: 'جدید',
      created: 'ایجاد شده',
      processing: 'در حال پردازش',
      packing: 'در حال بسته‌بندی',
      packed: 'بسته‌بندی شده',
      in_progress: 'در حال انجام',
      in_transit: 'در مسیر ارسال',
      ready: 'آماده',
      ready_for_pickup: 'آماده تحویل حضوری',
      scheduled: 'زمان‌بندی شده',
      fulfilled: 'انجام شده',
      delivered: 'تحویل داده شده',
      complete: 'کامل',
      completed: 'تکمیل شده',
      cancelled: 'لغو شده',
      canceled: 'لغو شده'
    },
    checkoutModes: {
      delivery: 'ارسال',
      local_delivery: 'ارسال محلی',
      courier: 'پیک',
      pickup: 'تحویل حضوری',
      pickup_only: 'تحویل حضوری',
      shipping: 'ارسال پستی',
      in_store: 'داخل فروشگاه',
      manual: 'دستی',
      quote: 'استعلام',
      online: 'آنلاین',
      card: 'کارت',
      cash: 'نقدی',
      unknown: 'نامشخص'
    },
    priorities: {
      overdue: 'معوق',
      today: 'جدید امروز',
      normal: 'عادی'
    }
  }
};

export function humanizeAdminFulfillmentValue(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return '';
  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function createAdminFulfillmentQueueTranslator(locale?: SupportedLocale | string | null) {
  const localeKey = adminLocaleKey(locale);
  const labels = copy[localeKey];

  function lookup(value: string | null | undefined, dictionary: Record<string, string>) {
    const key = value?.trim() ?? '';
    const translated = dictionary[key];
    if (translated) return translated;
    if (localeKey === 'fa') return labels.fallbackUnknown;
    return humanizeAdminFulfillmentValue(key) || labels.fallbackUnknown;
  }

  return {
    customerLabel(value?: string | null) {
      const trimmed = value?.trim();
      return !trimmed || trimmed === copy.en.guestCheckout ? labels.guestCheckout : trimmed;
    },
    orderStatus(value?: string | null) {
      return lookup(value, labels.orderStatuses);
    },
    fulfillmentStatus(value?: string | null) {
      return lookup(value, labels.fulfillmentStatuses);
    },
    checkoutMode(value?: string | null) {
      return lookup(value, labels.checkoutModes);
    },
    priority(value: FulfillmentPriority | string) {
      return lookup(value, labels.priorities);
    }
  };
}
