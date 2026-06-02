'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminSettingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Settings could not load" error={error} reset={reset} />;
}
