import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPublicInquiryService } from '../../lib/inquiries/public-inquiry-service-core';
import { INQUIRY_FIELD_LIMITS, validateInquiryInput } from '../../lib/inquiries/validate-inquiry';

function assertInquiryRejects(input: Parameters<typeof validateInquiryInput>[0], code: string) {
  const result = validateInquiryInput(input);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, code);
}

function assertInquiryFormUsesSharedBounds() {
  const formSource = readFileSync('components/ProductInquiryForm.tsx', 'utf8');

  assert.match(formSource, /import \{ INQUIRY_FIELD_LIMITS \} from '@\/lib\/inquiries\/validate-inquiry'/);
  assert.match(formSource, /name="name"[\s\S]*maxLength=\{INQUIRY_FIELD_LIMITS\.name\}/);
  assert.match(formSource, /name="phone"[\s\S]*maxLength=\{INQUIRY_FIELD_LIMITS\.phone\}/);
  assert.match(formSource, /name="email"[\s\S]*maxLength=\{INQUIRY_FIELD_LIMITS\.email\}/);
  assert.match(formSource, /name="message"[\s\S]*maxLength=\{INQUIRY_FIELD_LIMITS\.message\}/);
  assert.match(formSource, /name="deliveryNotes"[\s\S]*maxLength=\{INQUIRY_FIELD_LIMITS\.deliveryNotes\}/);
  assert.match(formSource, /'name-too-long'/);
  assert.match(formSource, /'phone-too-long'/);
  assert.match(formSource, /'email-too-long'/);
  assert.match(formSource, /'message-too-long'/);
  assert.match(formSource, /'delivery-notes-too-long'/);
}

function assertPublicInquiryActionUsesCooldownBoundary() {
  const actionSource = readFileSync('app/products/[slug]/actions.ts', 'utf8');

  assert.ok(actionSource.includes("const PUBLIC_INQUIRY_COOLDOWN_COOKIE = 'publicInquiryCooldown'"));
  assert.ok(actionSource.includes('const PUBLIC_INQUIRY_COOLDOWN_SECONDS = 60 * 5'));
  assert.ok(actionSource.includes('function assertInquirySubmissionNotThrottled'));
  assert.ok(actionSource.includes('function setInquirySubmissionThrottle'));
  assert.ok(actionSource.includes('sameSite: \'lax\''));
  assert.ok(actionSource.includes('httpOnly: true'));
  assert.ok(actionSource.includes("path: '/'"));
  assert.ok(actionSource.includes('maxAge: PUBLIC_INQUIRY_COOLDOWN_SECONDS'));

  const originIndex = actionSource.indexOf('await assertSameOriginServerAction()');
  const cookieIndex = actionSource.indexOf('const cookieStore = await cookies()');
  const throttleCheckIndex = actionSource.indexOf('assertInquirySubmissionNotThrottled(productSlug, cookieStore)');
  const databaseIndex = actionSource.indexOf('hasDatabase()');
  const validationIndex = actionSource.indexOf('validateInquiryInput({');
  const createIndex = actionSource.indexOf('publicInquiryService.createInquiry({');
  const setThrottleIndex = actionSource.indexOf('setInquirySubmissionThrottle(cookieStore)');

  assert.ok(originIndex >= 0);
  assert.ok(cookieIndex > originIndex);
  assert.ok(throttleCheckIndex > cookieIndex);
  assert.ok(throttleCheckIndex < databaseIndex);
  assert.ok(throttleCheckIndex < validationIndex);
  assert.ok(throttleCheckIndex < createIndex);
  assert.ok(setThrottleIndex > createIndex);
}

export async function runPublicInquiryServiceTests() {
  const creates: unknown[] = [];
  const notifications: unknown[] = [];
  const deliveryDate = new Date('2026-06-15T12:00:00.000Z');

  const service = createPublicInquiryService({
    inquiryRepository: {
      async create(args) {
        creates.push(args);
        return {
          id: 'inquiry-1',
          product: { title: 'Rose Bouquet' }
        };
      }
    },
    async notifyNewInquiry(input) {
      notifications.push(input);
    }
  });

  const inquiry = await service.createInquiry({
    productId: 'product-1',
    inquiry: {
      name: 'Mina Customer',
      phone: '+1 604 555 0101',
      email: 'mina@example.test',
      message: 'I would like a rose bouquet for a birthday.',
      deliveryDate,
      deliveryNotes: 'Leave with concierge.'
    }
  });

  assert.equal(inquiry.id, 'inquiry-1');
  assert.deepEqual(creates[0], {
    data: {
      name: 'Mina Customer',
      phone: '+1 604 555 0101',
      email: 'mina@example.test',
      message: 'I would like a rose bouquet for a birthday.',
      deliveryDate,
      deliveryNotes: 'Leave with concierge.',
      productId: 'product-1'
    },
    include: {
      product: { select: { title: true } }
    }
  });
  assert.deepEqual(notifications[0], {
    inquiryId: 'inquiry-1',
    productTitle: 'Rose Bouquet',
    customerName: 'Mina Customer',
    customerPhone: '+1 604 555 0101',
    customerEmail: 'mina@example.test',
    message: 'I would like a rose bouquet for a birthday.'
  });

  const validInput = {
    name: 'Mina Customer',
    phone: '+1 604 555 0101',
    email: 'mina@example.test',
    message: 'I would like a rose bouquet for a birthday.'
  };

  assert.deepEqual(INQUIRY_FIELD_LIMITS, {
    name: 200,
    phone: 40,
    email: 320,
    message: 1000,
    deliveryNotes: 500
  });
  assertInquiryRejects({ ...validInput, name: 'x'.repeat(INQUIRY_FIELD_LIMITS.name + 1) }, 'name-too-long');
  assertInquiryRejects({ ...validInput, phone: '+1 ' + '5'.repeat(38) }, 'phone-invalid');
  assertInquiryRejects({ ...validInput, email: `${'a'.repeat(309)}@example.test` }, 'email-too-long');
  assertInquiryRejects({ ...validInput, message: 'x'.repeat(INQUIRY_FIELD_LIMITS.message + 1) }, 'message-too-long');
  assertInquiryRejects({ ...validInput, deliveryNotes: 'x'.repeat(INQUIRY_FIELD_LIMITS.deliveryNotes + 1) }, 'delivery-notes-too-long');
  assertInquiryFormUsesSharedBounds();
  assertPublicInquiryActionUsesCooldownBoundary();

  console.log('public-inquiry-service.test.ts passed');
}
