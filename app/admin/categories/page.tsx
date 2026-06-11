import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  await requireAdminRouteSession();

  return <AdminConsolePage searchParams={searchParams} forcedTab="catalog" catalogSection="categories" activeNavKey="categories" />;
}
