import assert from 'node:assert/strict';
import { createAdminCookieJar, request, type ApiFixture } from './shared';

export async function runAdminExportBoundaryTests(fixture: ApiFixture) {
  await runOrderCsvEscapingAndFilterTest(fixture);
  await runProductCsvEscapingTest(fixture);
}

async function runOrderCsvEscapingAndFilterTest(fixture: ApiFixture) {
  const order = await fixture.prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-CSV-1001',
      publicLookupToken: 'api-e2e-csv-token',
      status: 'paid',
      checkoutMode: 'staff',
      currency: 'TOMAN',
      subtotalCents: 420000,
      totalCents: 420000,
      recipientName: 'CSV "Quoted", Customer',
      recipientPhone: '+16045559710',
      items: {
        create: {
          productId: fixture.productId,
          variantId: fixture.variantId,
          variantSku: 'CSV-E2E-SKU',
          variantName: 'CSV Variant',
          productTitle: 'CSV Product',
          productCode: 'CSV-PRODUCT',
          quantity: 1,
          unitPriceCents: 420000,
          lineTotalCents: 420000
        }
      },
      paymentAttempts: {
        create: {
          provider: 'manual',
          status: 'paid',
          amountCents: 420000,
          currency: 'TOMAN',
          providerReference: 'api-e2e-csv-paid'
        }
      }
    }
  });

  const jar = createAdminCookieJar();
  const response = await request('/admin/orders/csv?orderSearch=API-E2E-CSV-1001&orderStatus=paid&orderPaymentStatus=paid', {
    headers: { cookie: jar.header() }
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/csv/);
  const csv = await response.text();
  assert.match(csv, /"Created","Order","Customer"/);
  assert.match(csv, /"API-E2E-CSV-1001"/);
  assert.match(csv, /"CSV ""Quoted"", Customer"/);
  assert.doesNotMatch(csv, new RegExp(fixture.orderNumber));
  assert.ok(order.id, 'csv fixture order should be created');
}

async function runProductCsvEscapingTest(fixture: ApiFixture) {
  await fixture.prisma.product.update({
    where: { id: fixture.productId },
    data: {
      title: 'API CSV "Quoted", Bouquet',
      description: 'CSV description with "quotes", comma, and newline\nsecond line',
      seoTitle: 'API CSV SEO "Title"',
      seoDescription: 'API CSV SEO, description'
    }
  });

  const jar = createAdminCookieJar();
  const response = await request('/admin/products/export', { headers: { cookie: jar.header() } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/csv/);
  const csv = await response.text();
  assert.match(csv, /"title","slug","code"/);
  assert.match(csv, /"API CSV ""Quoted"", Bouquet"/);
  assert.match(csv, /"CSV description with ""quotes"", comma, and newline\nsecond line"/);
  assert.match(csv, /"API CSV SEO ""Title"""/);
}
