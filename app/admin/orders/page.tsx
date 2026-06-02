import { AdminConsolePage } from '@/app/admin/AdminConsolePage';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  return <AdminConsolePage searchParams={searchParams} forcedTab="sales" salesSection="orders" activeNavKey="orders" />;
}
