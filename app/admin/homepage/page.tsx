import { AdminConsolePage } from '@/app/admin/AdminConsolePage';

export const dynamic = 'force-dynamic';

export default async function AdminHomepagePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  return <AdminConsolePage searchParams={searchParams} forcedTab="content" contentSection="homepage" activeNavKey="homepage" />;
}
