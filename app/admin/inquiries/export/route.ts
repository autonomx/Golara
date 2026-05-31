import { NextResponse } from 'next/server';
import { assertAdminAuthenticated, getAdminIdentity } from '@/lib/admin-auth';
import { listInquiries } from '@/lib/cms/catalog-repository';
import { filterInquiriesByAssignmentQueue, parseInquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';
import { createInquiryReportRows } from '@/lib/inquiries/inquiry-reporting';

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
  const search = url.searchParams.get('inquirySearch') ?? undefined;
  const assignmentQueue = parseInquiryAssignmentQueueFilter(url.searchParams.get('inquiryAssignment'));
  const identity = await getAdminIdentity();
  const inquiries = filterInquiriesByAssignmentQueue(await listInquiries(status, search), assignmentQueue, identity);
  const reportRows = createInquiryReportRows(inquiries, identity);

  const header = csvRow([
    'created_at',
    'status',
    'status_label',
    'product',
    'name',
    'phone',
    'email',
    'assigned',
    'assignee_label',
    'assignee_email',
    'assignee_role',
    'assigned_at',
    'assignment_queue',
    'assignment_queue_label',
    'delivery_date',
    'delivery_notes',
    'message',
    'staff_notes',
    'follow_up_count',
    'latest_follow_up_channel',
    'latest_follow_up_at',
    'latest_follow_up_note',
    'recommended_action'
  ]);

  const rows = reportRows.map((row) =>
    csvRow([
      row.createdAt,
      row.status,
      row.statusLabel,
      row.productTitle,
      row.customerName,
      row.phone,
      row.email,
      row.assigned ? 'yes' : 'no',
      row.assigneeLabel,
      row.assigneeEmail,
      row.assigneeRole,
      row.assignedAt,
      row.assignmentQueue,
      row.assignmentQueueLabel,
      row.deliveryDate,
      row.deliveryNotes,
      row.message,
      row.staffNotes,
      row.followUpCount,
      row.latestFollowUpChannel,
      row.latestFollowUpAt,
      row.latestFollowUpNote,
      row.recommendedAction
    ])
  );

  const csv = [header, ...rows].join('\n');
  const fileStatus = status ? `-${status}` : '';
  const fileSearch = search ? '-search' : '';
  const fileAssignment = assignmentQueue !== 'all' ? `-${assignmentQueue}` : '';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="golara-inquiries${fileStatus}${fileSearch}${fileAssignment}.csv"`
    }
  });
}
