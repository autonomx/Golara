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
  entity: 'productVariant' | 'productVariantLocationStock';
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

export type VariantLocationStockAuditSnapshot = {
  id?: string;
  variantId: string;
  locationId: string;
  quantity: number;
  reservedQuantity?: number | null;
  lowStockThreshold?: number | null;
  variant?: {
    sku: string;
    name: string;
    product?: {
      title: string;
      code: string;
    } | null;
  } | null;
  location?: {
    slug: string;
    name: string;
  } | null;
};

export type VariantLocationStockAuditInput = {
  action: string;
  entity: 'productVariantLocationStock';
  entityId: string;
  summary: string;
  metadata: {
    productTitle?: string;
    productCode?: string;
    variantId: string;
    variantSku?: string;
    variantName?: string;
    locationId: string;
    locationSlug?: string;
    locationName?: string;
    previousQuantity?: number;
    quantity: number;
    previousReservedQuantity?: number;
    reservedQuantity: number;
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

function reservedQuantity(value?: number | null) {
  return value ?? 0;
}

function locationThreshold(value?: number | null) {
  return value ?? null;
}

function locationStockLabel(snapshot: VariantLocationStockAuditSnapshot) {
  const variantName = snapshot.variant?.name ?? snapshot.variantId;
  const locationName = snapshot.location?.name ?? snapshot.locationId;
  return `${variantName} at ${locationName}`;
}

export function buildVariantLocationStockAuditInput(previous: VariantLocationStockAuditSnapshot | null, next: VariantLocationStockAuditSnapshot): VariantLocationStockAuditInput | null {
  const previousReservedQuantity = previous ? reservedQuantity(previous.reservedQuantity) : undefined;
  const nextReservedQuantity = reservedQuantity(next.reservedQuantity);
  const previousLowStockThreshold = previous ? locationThreshold(previous.lowStockThreshold) : undefined;
  const nextLowStockThreshold = locationThreshold(next.lowStockThreshold);
  const changedFields: string[] = [];

  if (!previous) {
    changedFields.push('quantity', 'reservedQuantity', 'lowStockThreshold');
  } else {
    if (previous.quantity !== next.quantity) changedFields.push('quantity');
    if (previousReservedQuantity !== nextReservedQuantity) changedFields.push('reservedQuantity');
    if (previousLowStockThreshold !== nextLowStockThreshold) changedFields.push('lowStockThreshold');
  }

  if (!changedFields.length) return null;

  const action = previous ? 'inventory.location_stock.adjust' : 'inventory.location_stock.create';
  const summary = previous
    ? `Adjusted location stock for ${locationStockLabel(next)}: ${previous.quantity} to ${next.quantity}`
    : `Created location stock for ${locationStockLabel(next)}: ${next.quantity}`;

  return {
    action,
    entity: 'productVariantLocationStock',
    entityId: next.id ?? `${next.variantId}:${next.locationId}`,
    summary,
    metadata: {
      productTitle: next.variant?.product?.title,
      productCode: next.variant?.product?.code,
      variantId: next.variantId,
      variantSku: next.variant?.sku,
      variantName: next.variant?.name,
      locationId: next.locationId,
      locationSlug: next.location?.slug,
      locationName: next.location?.name,
      previousQuantity: previous?.quantity,
      quantity: next.quantity,
      previousReservedQuantity,
      reservedQuantity: nextReservedQuantity,
      previousLowStockThreshold,
      lowStockThreshold: nextLowStockThreshold,
      changedFields
    }
  };
}
