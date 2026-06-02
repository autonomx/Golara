import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { buildVariantStockAuditInput, type VariantStockAuditSnapshot } from '@/lib/inventory/variant-stock-audit';

export const variantStockAuditService = {
  async recordChange(previous: VariantStockAuditSnapshot | null, next: VariantStockAuditSnapshot) {
    const auditInput = buildVariantStockAuditInput(previous, next);
    if (!auditInput) return;
    await recordAdminAuditLog(auditInput);
  }
};
