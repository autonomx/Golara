'use client';

import { AdminRouteError } from '@/components/admin/AdminRouteError';

export default function AdminMediaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminRouteError title="Media library could not load" error={error} reset={reset} />;
}
