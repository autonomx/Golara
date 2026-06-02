export type VariantStockStatus = 'inactive' | 'untracked' | 'out_of_stock' | 'low_stock' | 'in_stock';

export type VariantStockInput = {
  isActive?: boolean;
  stockQuantity?: number | null;
  trackInventory?: boolean;
  lowStockThreshold?: number | null;
};

export type VariantStockSummary = {
  status: VariantStockStatus;
  canSell: boolean;
  label: string;
  detail: string;
};

function nonNegativeInteger(value: number | null | undefined, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value ?? fallback));
}

function optionalNonNegativeInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.floor(value));
}

export function getVariantStockSummary(input: VariantStockInput): VariantStockSummary {
  const isActive = input.isActive ?? true;
  const trackInventory = input.trackInventory ?? true;
  const stockQuantity = nonNegativeInteger(input.stockQuantity);
  const lowStockThreshold = optionalNonNegativeInteger(input.lowStockThreshold);

  if (!isActive) {
    return {
      status: 'inactive',
      canSell: false,
      label: 'Inactive',
      detail: 'This variant is inactive and should not be sold.'
    };
  }

  if (!trackInventory) {
    return {
      status: 'untracked',
      canSell: true,
      label: 'Inventory not tracked',
      detail: 'This variant can be sold without checking on-hand stock.'
    };
  }

  if (stockQuantity <= 0) {
    return {
      status: 'out_of_stock',
      canSell: false,
      label: 'Out of stock',
      detail: 'Tracked inventory is zero, so staff should restock before selling.'
    };
  }

  if (lowStockThreshold !== undefined && stockQuantity <= lowStockThreshold) {
    return {
      status: 'low_stock',
      canSell: true,
      label: 'Low stock',
      detail: `Only ${stockQuantity} left; threshold is ${lowStockThreshold}.`
    };
  }

  return {
    status: 'in_stock',
    canSell: true,
    label: 'In stock',
    detail: `${stockQuantity} available.`
  };
}

export function canSellVariant(input: VariantStockInput) {
  return getVariantStockSummary(input).canSell;
}
