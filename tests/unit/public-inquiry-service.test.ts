import assert from 'node:assert/strict';
import { createPublicInquiryService } from '../../lib/inquiries/public-inquiry-service-core';

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

  console.log('public-inquiry-service.test.ts passed');
}
