'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminDiscountsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Discounts could not load" error={error} reset={reset} />;
}
