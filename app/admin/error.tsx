'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Admin overview could not load" error={error} reset={reset} />;
}
