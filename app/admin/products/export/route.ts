import { NextResponse } from 'next/server';
import { assertAdminRole } from '@/lib/admin-auth';
import { listAdminProducts } from '@/lib/cms/catalog-repository';

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(',');
}

export async function GET() {
  await assertAdminRole('staff');

  const products = await listAdminProducts();
  const header = csvRow([
    'title',
    'slug',
    'code',
    'description',
    'price',
    'currency',
    'imageUrl',
    'categoryId',
    'categorySlug',
    'productTypeId',
    'productTypeName',
    'availableToday',
    'bestSeller',
    'requiresQuote',
    'isActive',
    'seoTitle',
    'seoDescription',
    'canonicalPath',
    'seoIndex'
  ]);

  const rows = products.map((product) =>
    csvRow([
      product.title,
      product.slug,
      product.code,
      product.description,
      product.price,
      product.currency,
      product.image,
      product.categoryId,
      product.category,
      product.productTypeId,
      product.productTypeName,
      product.availableToday ? 'true' : 'false',
      product.bestSeller ? 'true' : 'false',
      product.requiresQuote ? 'true' : 'false',
      product.isActive !== false ? 'true' : 'false',
      product.seoTitle,
      product.seoDescription,
      product.canonicalPath,
      product.seoIndex !== false ? 'true' : 'false'
    ])
  );

  return new NextResponse([header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="golara-products.csv"'
    }
  });
}
