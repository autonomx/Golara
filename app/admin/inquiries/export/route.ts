import { NextResponse } from 'next/server';
import { assertAdminAuthenticated } from '@/lib/admin-auth';
import { listInquiries } from '@/lib/cms/catalog-repository';

function csvCell(value: unknown) {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(',');
}

export async function GET(request: Request) {
  await assertAdminAuthenticated();

  const url = new URL(request.url);
  const status = url.searchParams.get('inquiryStatus') ?? undefined;
  const inquiries = await listInquiries(status);

  const header = csvRow([
    'created_at',
    'status',
    'product',
    'name',
    'phone',
    'email',
    'delivery_date',
    'delivery_notes',
    'message',
    'staff_notes',
    'follow_up_count'
  ]);

  const rows = inquiries.map((inquiry) =>
    csvRow([
      inquiry.createdAt,
      inquiry.status,
      inquiry.productTitle,
      inquiry.name,
      inquiry.phone,
      inquiry.email,
      inquiry.deliveryDate,
      inquiry.deliveryNotes,
      inquiry.message,
      inquiry.staffNotes,
      inquiry.followUps?.length ?? 0
    ])
  );

  const csv = [header, ...rows].join('\n');
  const fileStatus = status ? `-${status}` : '';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="golara-inquiries${fileStatus}.csv"`
    }
  });
}
