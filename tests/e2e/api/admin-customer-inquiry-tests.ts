import assert from 'node:assert/strict';
import {
  appendServerActionFields,
  assertRedirect,
  createAdminCookieJar,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminCustomerInquiryActionTests(fixture: ApiFixture) {
  await runAdminCustomerProfileActionTests(fixture);
  await runAdminInquiryWorkflowActionTests(fixture);
}

async function runAdminCustomerProfileActionTests(fixture: ApiFixture) {
  const jar = createAdminCookieJar();
  const detailPath = `/admin/customers/${fixture.customerId}`;

  const detailResponse = await request(detailPath, { headers: { cookie: jar.header() } });
  assert.equal(detailResponse.status, 200);
  const detailHtml = await responseText(detailResponse);

  const profileForm = new FormData();
  appendServerActionFields(profileForm, detailHtml, 'Save profile');
  profileForm.set('displayName', 'API E2E Admin Customer Updated');
  profileForm.set('email', 'api-admin-customer.e2e@golara.test');
  profileForm.set('locale', 'en-CA');

  const profileResponse = await submitServerAction(detailPath, profileForm, jar);
  assertRedirect(profileResponse, `${detailPath}?status=customer-profile-updated`);

  const customer = await fixture.prisma.customerProfile.findUniqueOrThrow({
    where: { id: fixture.customerId }
  });
  assert.equal(customer.displayName, 'API E2E Admin Customer Updated');
  assert.equal(customer.email, 'api-admin-customer.e2e@golara.test');
  assert.equal(customer.locale, 'en-CA');

  const updatedDetailResponse = await request(detailPath, { headers: { cookie: jar.header() } });
  assert.equal(updatedDetailResponse.status, 200);
  const updatedDetailHtml = await responseText(updatedDetailResponse);

  const noteForm = new FormData();
  appendServerActionFields(noteForm, updatedDetailHtml, 'Add staff note');
  noteForm.set('note', 'API E2E admin customer timeline note');

  const noteResponse = await submitServerAction(detailPath, noteForm, jar);
  assertRedirect(noteResponse, `${detailPath}?status=customer-note-added`);

  const noteCount = await fixture.prisma.customerAdminTimelineEvent.count({
    where: {
      customerId: fixture.customerId,
      type: 'staff_note',
      title: 'Staff note',
      note: 'API E2E admin customer timeline note'
    }
  });
  assert.equal(noteCount, 1);
}

async function runAdminInquiryWorkflowActionTests(fixture: ApiFixture) {
  const jar = createAdminCookieJar();
  const inquirySearch = 'api-inquiry-admin.e2e@golara.test';
  const inquiry = await fixture.prisma.customerInquiry.create({
    data: {
      productId: fixture.productId,
      name: 'API E2E Inquiry Admin Customer',
      phone: '+16045559888',
      email: inquirySearch,
      message: 'API E2E inquiry admin workflow message with "quoted" CSV content.',
      deliveryDate: new Date('2026-06-20T00:00:00.000Z'),
      deliveryNotes: 'api-e2e-inquiry-export delivery notes',
      status: 'new'
    }
  });
  const boardPath = `/admin/inquiries?inquirySearch=${encodeURIComponent(inquirySearch)}`;

  const boardResponse = await request(boardPath, { headers: { cookie: jar.header() } });
  assert.equal(boardResponse.status, 200);
  const boardHtml = await responseText(boardResponse);
  assert.match(boardHtml, /API E2E Inquiry Admin Customer/);

  const saveForm = new FormData();
  appendServerActionFields(saveForm, boardHtml, 'Save inquiry');
  saveForm.set('status', 'contacted');
  saveForm.set('staffNotes', 'API E2E inquiry admin note');
  saveForm.set('returnInquirySearch', inquirySearch);

  const saveResponse = await submitServerAction(boardPath, saveForm, jar);
  assertRedirect(saveResponse, `/admin/inquiries?status=inquiry-updated&inquirySearch=${encodeURIComponent(inquirySearch)}`);

  const savedInquiry = await fixture.prisma.customerInquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
  assert.equal(savedInquiry.status, 'contacted');
  assert.equal(savedInquiry.staffNotes, 'API E2E inquiry admin note');

  const assignedBoardResponse = await request(boardPath, { headers: { cookie: jar.header() } });
  assert.equal(assignedBoardResponse.status, 200);
  const assignedBoardHtml = await responseText(assignedBoardResponse);

  const assignForm = new FormData();
  appendServerActionFields(assignForm, assignedBoardHtml, 'Assign to me');
  assignForm.set('assignmentAction', 'assign-to-me');
  assignForm.set('returnInquirySearch', inquirySearch);

  const assignResponse = await submitServerAction(boardPath, assignForm, jar);
  assertRedirect(assignResponse, `/admin/inquiries?status=inquiry-assigned&inquirySearch=${encodeURIComponent(inquirySearch)}`);

  const assignedInquiry = await fixture.prisma.customerInquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
  assert.equal(assignedInquiry.assignedAdminRole, 'owner');
  assert.ok(assignedInquiry.assignedAdminLabel);
  assert.ok(assignedInquiry.assignedAt);

  const followUpBoardResponse = await request(boardPath, { headers: { cookie: jar.header() } });
  assert.equal(followUpBoardResponse.status, 200);
  const followUpBoardHtml = await responseText(followUpBoardResponse);

  const followUpForm = new FormData();
  appendServerActionFields(followUpForm, followUpBoardHtml, 'Add follow-up');
  followUpForm.set('channel', 'phone');
  followUpForm.set('note', 'API E2E inquiry follow-up note');
  followUpForm.set('returnInquirySearch', inquirySearch);

  const followUpResponse = await submitServerAction(boardPath, followUpForm, jar);
  assertRedirect(followUpResponse, `/admin/inquiries?status=follow-up-added&inquirySearch=${encodeURIComponent(inquirySearch)}`);

  const followUpCount = await fixture.prisma.customerInquiryFollowUp.count({
    where: {
      inquiryId: inquiry.id,
      channel: 'phone',
      note: 'API E2E inquiry follow-up note'
    }
  });
  assert.equal(followUpCount, 1);

  const unauthenticatedExport = await request('/admin/inquiries/export');
  assert.equal(unauthenticatedExport.status, 401);

  const exportResponse = await request(`/admin/inquiries/export?inquirySearch=${encodeURIComponent(inquirySearch)}`, {
    headers: { cookie: jar.header() }
  });
  assert.equal(exportResponse.status, 200);
  assert.match(exportResponse.headers.get('content-type') ?? '', /text\/csv/);
  assert.match(exportResponse.headers.get('content-disposition') ?? '', /golara-inquiries/);
  const csv = await exportResponse.text();
  assert.match(csv, /"created_at","status","status_label"/);
  assert.match(csv, /"contacted"/);
  assert.match(csv, /"API E2E Inquiry Admin Customer"/);
  assert.match(csv, /"api-inquiry-admin\.e2e@golara\.test"/);
  assert.match(csv, /"API E2E inquiry admin note"/);
  assert.match(csv, /"API E2E inquiry follow-up note"/);
  assert.match(csv, /"api-e2e-inquiry-export delivery notes"/);
  assert.match(csv, /"API E2E inquiry admin workflow message with ""quoted"" CSV content\."/);
}
