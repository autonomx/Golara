import { StorefrontCatalogLoadingSkeleton } from '@/components/StorefrontRouteSkeleton';

export default function ProductsLoading() {
  return <StorefrontCatalogLoadingSkeleton withSearch productCount={6} />;
}
