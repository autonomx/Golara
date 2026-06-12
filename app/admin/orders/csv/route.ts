import { NextResponse } from 'next/server';
import { assertAdminRole } from '@/lib/admin-auth';
import { listAdminCheckoutOrdersForExport } from '@/lib/checkout/admin-order-repository';

function optionalParam(value: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    await assertAdminRole('owner');
  } catch {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const orders = await listAdminCheckoutOrdersForExport({
    status: optionalParam(url.searchParams.get('orderStatus')),
    paymentStatus: optionalParam(url.searchParams.get('orderPaymentStatus')),
    search: optionalParam(url.searchParams.get('orderSearch'))
  });

  const header = ['Created', 'Order', 'Customer', 'Phone', 'Status', 'Payment', 'Items', 'Total'];
  const rows = orders.map((order) => [
    order.createdAt.toISOString(),
    order.orderNumber,
    order.customerName || '',
    order.customerPhone || '',
    order.status,
    order.latestPaymentStatus || '',
    order.itemCount,
    `${order.totalCents / 100} ${order.currency}`
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="golara-orders.csv"'
    }
  });
}
