'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminCategoriesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Categories could not load" error={error} reset={reset} />;
}
