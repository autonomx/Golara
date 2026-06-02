import type { ProductVariant } from '@/lib/catalog';

export type DbProductVariantForCatalog = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  stockQuantity: number;
  trackInventory?: boolean | null;
  lowStockThreshold?: number | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: Date;
};

export function mapProductVariantForCatalog(variant: DbProductVariantForCatalog): ProductVariant {
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    name: variant.name,
    price: variant.priceCents / 100,
    currency: variant.currency,
    image: variant.imageUrl ?? undefined,
    stockQuantity: variant.stockQuantity,
    trackInventory: variant.trackInventory ?? true,
    lowStockThreshold: variant.lowStockThreshold ?? undefined,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
    updatedAt: variant.updatedAt
  };
}
