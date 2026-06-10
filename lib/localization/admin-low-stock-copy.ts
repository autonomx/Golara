import type { SupportedLocale } from '@/lib/i18n/locales';
import type { LowStockAlertSeverity } from '@/lib/analytics/low-stock-alerts';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const faStatus: Record<LowStockAlertSeverity, string> = {
  out_of_stock: 'ناموجود',
  low_stock: 'کمبود موجودی'
};

const enStatus: Record<LowStockAlertSeverity, string> = {
  out_of_stock: 'Out of stock',
  low_stock: 'Low stock'
};

export function getAdminLowStockStatusLabel(status: LowStockAlertSeverity, locale?: SupportedLocale | string | null) {
  return adminLocaleKey(locale) === 'fa' ? faStatus[status] : enStatus[status];
}

export function getAdminLowStockDetail(
  status: LowStockAlertSeverity,
  stockQuantity: number,
  lowStockThreshold?: number | null,
  locale?: SupportedLocale | string | null
) {
  const isFa = adminLocaleKey(locale) === 'fa';

  if (status === 'out_of_stock') {
    return isFa ? 'موجودی رهگیری‌شده صفر است؛ تیم باید پیش از فروش موجودی را شارژ کند.' : 'Tracked inventory is zero, so staff should restock before selling.';
  }

  if (typeof lowStockThreshold === 'number') {
    return isFa ? `فقط ${stockQuantity} عدد باقی مانده؛ آستانه ${lowStockThreshold} است.` : `Only ${stockQuantity} left; threshold is ${lowStockThreshold}.`;
  }

  return isFa ? `فقط ${stockQuantity} عدد باقی مانده.` : `Only ${stockQuantity} left.`;
}
