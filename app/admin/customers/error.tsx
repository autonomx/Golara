'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminCustomersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Customers could not load" error={error} reset={reset} />;
}
