export type VariantStockAuditSnapshot = {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  trackInventory?: boolean | null;
  lowStockThreshold?: number | null;
  product?: {
    title: string;
    code: string;
  } | null;
};

export type VariantStockAuditInput = {
  action: string;
  entity: 'productVariant';
  entityId: string;
  summary: string;
  metadata: {
    productTitle?: string;
    productCode?: string;
    variantSku: string;
    variantName: string;
    previousStockQuantity?: number;
    stockQuantity: number;
    previousTrackInventory?: boolean;
    trackInventory: boolean;
    previousLowStockThreshold?: number | null;
    lowStockThreshold?: number | null;
    changedFields: string[];
  };
};

function stockTracked(value?: boolean | null) {
  return value ?? true;
}

function nullableThreshold(value?: number | null) {
  return value ?? null;
}

function variantLabel(snapshot: VariantStockAuditSnapshot) {
  return snapshot.product?.title ? `${snapshot.product.title} / ${snapshot.name}` : snapshot.name;
}

export function buildVariantStockAuditInput(previous: VariantStockAuditSnapshot | null, next: VariantStockAuditSnapshot): VariantStockAuditInput | null {
  const previousTrackInventory = previous ? stockTracked(previous.trackInventory) : undefined;
  const trackInventory = stockTracked(next.trackInventory);
  const previousLowStockThreshold = previous ? nullableThreshold(previous.lowStockThreshold) : undefined;
  const lowStockThreshold = nullableThreshold(next.lowStockThreshold);
  const changedFields: string[] = [];

  if (!previous) {
    changedFields.push('stockQuantity', 'trackInventory', 'lowStockThreshold');
  } else {
    if (previous.stockQuantity !== next.stockQuantity) changedFields.push('stockQuantity');
    if (previousTrackInventory !== trackInventory) changedFields.push('trackInventory');
    if (previousLowStockThreshold !== lowStockThreshold) changedFields.push('lowStockThreshold');
  }

  if (!changedFields.length) return null;

  const action = previous ? 'inventory.variant_stock.adjust' : 'inventory.variant_stock.create';
  const summary = previous
    ? `Adjusted stock controls for ${variantLabel(next)}: stock ${previous.stockQuantity} to ${next.stockQuantity}`
    : `Created stock controls for ${variantLabel(next)}: stock ${next.stockQuantity}`;

  return {
    action,
    entity: 'productVariant',
    entityId: next.id,
    summary,
    metadata: {
      productTitle: next.product?.title,
      productCode: next.product?.code,
      variantSku: next.sku,
      variantName: next.name,
      previousStockQuantity: previous?.stockQuantity,
      stockQuantity: next.stockQuantity,
      previousTrackInventory,
      trackInventory,
      previousLowStockThreshold,
      lowStockThreshold,
      changedFields
    }
  };
}
