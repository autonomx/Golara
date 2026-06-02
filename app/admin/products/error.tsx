'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminProductsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Products could not load" error={error} reset={reset} />;
}
