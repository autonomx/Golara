import assert from 'node:assert/strict';
import { createAdminCookieJar, request, responseText, type ApiFixture } from './shared';

export async function runAdminDiscountWorkspaceTests(fixture: ApiFixture) {
  await fixture.prisma.promotionStoreCredit.deleteMany({ where: { code: 'API-E2E-CREDIT-25' } });
  await fixture.prisma.promotionDiscount.deleteMany({ where: { slug: 'api-e2e-summer-roses' } });

  const discount = await fixture.prisma.promotionDiscount.create({
    data: {
      name: 'API E2E Summer Roses',
      slug: 'api-e2e-summer-roses',
      discountType: 'percentage',
      value: 15,
      currency: 'CAD',
      status: 'active',
      isActive: true,
      usageCount: 2,
      usageLimit: 5,
      minimumSubtotalCents: 7500,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-06-30T00:00:00.000Z'),
      vouchers: {
        create: [
          {
            code: 'API-E2E-SUMMER-15',
            status: 'active',
            isActive: true,
            usageCount: 1,
            usageLimit: 3,
            minimumSubtotalCents: 7500
          },
          {
            code: 'API-E2E-VIP-15',
            status: 'scheduled',
            isActive: true,
            usageCount: 0,
            usageLimit: 2,
            startsAt: new Date('2026-06-10T00:00:00.000Z')
          }
        ]
      },
      eligibilityRules: {
        create: {
          targetType: 'product',
          targetId: fixture.productId,
          effect: 'include'
        }
      }
    }
  });

  await fixture.prisma.promotionStoreCredit.create({
    data: {
      code: 'API-E2E-CREDIT-25',
      customerId: fixture.customerId,
      currency: 'CAD',
      initialBalanceCents: 2500,
      balanceCents: 1250,
      status: 'active',
      isActive: true,
      expiresAt: new Date('2026-12-31T00:00:00.000Z')
    }
  });

  const adminJar = createAdminCookieJar();
  const response = await request('/admin/discounts', { headers: { cookie: adminJar.header() } });
  assert.equal(response.status, 200);
  const html = await responseText(response);
  assert.match(html, /Promotions workspace/);
  assert.match(html, /API E2E Summer Roses/);
  assert.match(html, /api-e2e-summer-roses/);
  assert.match(html, /15%/);
  assert.match(html, /Min[\s\S]*CAD[\s\S]*7,500/);
  assert.match(html, /API-E2E-SUMMER-15/);
  assert.match(html, /API-E2E-VIP-15/);
  assert.match(html, /2\/5/);
  assert.match(html, /1 rule/);
  assert.match(html, /API-E2E-CREDIT-25/);
  assert.match(html, /Balance:[\s\S]*CAD[\s\S]*1,250/);
  assert.ok(discount.id);
}
