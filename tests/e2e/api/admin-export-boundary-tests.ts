import assert from 'node:assert/strict';
import { createAdminCookieJar, request, type ApiFixture } from './shared';

export async function runAdminExportBoundaryTests(fixture: ApiFixture) {
  await runOrderCsvEscapingAndFilterTest(fixture);
  await runProductCsvEscapingTest(fixture);
}

async function runOrderCsvEscapingAndFilterTest(fixture: ApiFixture) {
  const customer = await fixture.prisma.customerProfile.create({
    data: {
      phone: '+16045559710',
      displayName: 'CSV "Quoted", Customer',
      email: 'api-csv-customer.e2e@golara.test',
      locale: 'en-CA',
      addresses: {
        create: {
          label: 'API CSV Address',
          recipient: 'CSV "Quoted", Customer',
          phone: '+16045559710',
          city: 'Vancouver',
          line1: '710 CSV Export Way',
          isDefault: true
        }
      }
    },
    include: { addresses: true }
  });

  const order = await fixture.prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-CSV-1001',
      publicLookupToken: 'api-e2e-csv-token',
      customerId: customer.id,
      addressId: customer.addresses[0]?.id,
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
  assert.match(csv, /"\+16045559710"/);
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
