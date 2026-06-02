import { AdminConsolePage } from '@/app/admin/AdminConsolePage';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  return <AdminConsolePage searchParams={searchParams} forcedTab="sales" salesSection="inquiries" activeNavKey="inquiries" />;
}
