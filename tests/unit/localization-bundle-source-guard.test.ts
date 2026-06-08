import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

describe('localization bundle source guard', () => {
  it('keeps admin overview summary panels locale-aware', () => {
    const files = [
      'components/admin/AdminBestSellingProductsPanel.tsx',
      'components/admin/AdminLowStockAlertsPanel.tsx',
      'components/admin/AdminFulfillmentQueueSummaryPanel.tsx',
      'components/admin/AdminFailedPaymentNotificationAlertsPanel.tsx',
      'components/admin/AdminLaunchReadinessHealthPanel.tsx'
    ];

    for (const file of files) {
      const content = source(file);
      expect(content, `${file} should expose Farsi copy`).toContain('fa:');
      expect(content, `${file} should accept a locale prop`).toContain('locale?: SupportedLocale');
      expect(content, `${file} should resolve copy through localeKey`).toContain('localeKey(locale)');
    }
  });

  it('keeps admin orders locale-aware', () => {
    const content = source('components/admin/AdminOrderPanel.tsx');

    expect(content).toContain('fa:');
    expect(content).toContain('resolveStorefrontLocale');
    expect(content).toContain('export async function AdminOrderPanel');
    expect(content).toContain('activeLocale');
    expect(content).toContain('عملیات سفارش');
  });

  it('keeps public seed catalog fallback localization available', () => {
    const content = source('lib/localization/catalog-seed-fallback.ts');

    expect(content).toContain('localizeSeedCategories');
    expect(content).toContain('localizeSeedProducts');
    expect(content).toContain('باکس گل');
    expect(content).toContain('دسته‌گل');
    expect(content).toContain('چیدمان');
  });
});
