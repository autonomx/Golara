import assert from 'node:assert/strict';
import {
  appendServerActionFields,
  assertRedirect,
  createAdminCookieJar,
  expectHtml,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminProductCatalogActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const productPath = `/admin/products/${fixture.productId}`;
  const product = await fixture.prisma.product.findUniqueOrThrow({ where: { id: fixture.productId }, include: { category: true } });

  const updateProductHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const updateProductForm = new FormData();
  appendServerActionFields(updateProductForm, updateProductHtml, 'Save product');
  updateProductForm.set('title', 'API E2E Catalog Product Updated');
  updateProductForm.set('slug', product.slug);
  updateProductForm.set('code', product.code);
  updateProductForm.set('categoryId', product.categoryId);
  updateProductForm.set('productTypeId', '');
  updateProductForm.set('description', 'API E2E catalog product description updated through admin product form.');
  updateProductForm.set('seoTitle', 'API E2E Catalog SEO Title');
  updateProductForm.set('seoDescription', 'API E2E catalog SEO description.');
  updateProductForm.set('canonicalPath', `/products/${product.slug}`);
  updateProductForm.set('seoIndex', 'on');
  updateProductForm.set('price', '1500');
  updateProductForm.set('currency', 'TOMAN');
  updateProductForm.set('selectedMediaUrl', '');
  updateProductForm.set('imageUrl', 'https://example.com/api-e2e-product-updated.jpg');
  updateProductForm.set('availableToday', 'on');
  updateProductForm.set('bestSeller', 'on');
  updateProductForm.set('isActive', 'on');
  updateProductForm.set('sortOrder', '42');
  const updateProductResponse = await submitServerAction(productPath, updateProductForm, adminJar);
  assertRedirect(updateProductResponse, `${productPath}?status=product-updated`);

  const updatedProduct = await fixture.prisma.product.findUniqueOrThrow({ where: { id: fixture.productId } });
  assert.equal(updatedProduct.title, 'API E2E Catalog Product Updated');
  assert.equal(updatedProduct.priceCents, 150000);
  assert.equal(updatedProduct.imageUrl, 'https://example.com/api-e2e-product-updated.jpg');
  assert.equal(updatedProduct.bestSeller, true);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action: 'product.update', entityId: fixture.productId } }), 1);

  const createTypeHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createTypeForm = new FormData();
  appendServerActionFields(createTypeForm, createTypeHtml, 'Create type');
  createTypeForm.set('returnProductId', fixture.productId);
  createTypeForm.set('name', 'API E2E Product Type');
  createTypeForm.set('slug', 'api-e2e-product-type');
  createTypeForm.set('description', 'API E2E product type description.');
  createTypeForm.set('sortOrder', '11');
  createTypeForm.set('isActive', 'on');
  const createTypeResponse = await submitServerAction(productPath, createTypeForm, adminJar);
  assertRedirect(createTypeResponse, `${productPath}?status=product-type-created`);
  const productType = await fixture.prisma.productType.findUniqueOrThrow({ where: { slug: 'api-e2e-product-type' } });
  assert.equal(productType.name, 'API E2E Product Type');

  const createAttributeHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createAttributeForm = new FormData();
  appendServerActionFields(createAttributeForm, createAttributeHtml, 'Create attribute');
  createAttributeForm.set('returnProductId', fixture.productId);
  createAttributeForm.set('name', 'API E2E Color Family');
  createAttributeForm.set('slug', 'api-e2e-color-family');
  createAttributeForm.set('description', 'API E2E catalog color family attribute.');
  createAttributeForm.set('inputType', 'select');
  createAttributeForm.set('appliesTo', 'both');
  createAttributeForm.set('unit', '');
  createAttributeForm.set('sortOrder', '12');
  createAttributeForm.set('options', 'Red\nPink\nWhite');
  createAttributeForm.set('isFilterable', 'on');
  createAttributeForm.set('isActive', 'on');
  const createAttributeResponse = await submitServerAction(productPath, createAttributeForm, adminJar);
  assertRedirect(createAttributeResponse, `${productPath}?status=product-attribute-created`);
  const attribute = await fixture.prisma.productAttribute.findUniqueOrThrow({ where: { slug: 'api-e2e-color-family' } });
  assert.equal(attribute.inputType, 'select');
  assert.equal(attribute.appliesTo, 'both');

  const productValueHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const productValueForm = new FormData();
  appendServerActionFields(productValueForm, productValueHtml, `attributeValue:${attribute.id}`);
  productValueForm.set('attributeId', attribute.id);
  productValueForm.set(`attributeValue:${attribute.id}`, 'Red');
  const productValueResponse = await submitServerAction(productPath, productValueForm, adminJar);
  assertRedirect(productValueResponse, `${productPath}?status=product-attribute-values-updated`);
  const productAttributeValue = await fixture.prisma.productAttributeValue.findUniqueOrThrow({
    where: { attributeId_productId: { attributeId: attribute.id, productId: fixture.productId } }
  });
  assert.equal(productAttributeValue.value, 'Red');

  const createCollectionHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createCollectionForm = new FormData();
  appendServerActionFields(createCollectionForm, createCollectionHtml, 'Create collection');
  createCollectionForm.set('returnProductId', fixture.productId);
  createCollectionForm.set('title', 'API E2E Collection');
  createCollectionForm.set('slug', 'api-e2e-collection');
  createCollectionForm.set('description', 'API E2E merchandising collection.');
  createCollectionForm.set('sortOrder', '13');
  createCollectionForm.set('isActive', 'on');
  const createCollectionResponse = await submitServerAction(productPath, createCollectionForm, adminJar);
  assertRedirect(createCollectionResponse, `${productPath}?status=product-collection-created`);
  const collection = await fixture.prisma.collection.findUniqueOrThrow({ where: { slug: 'api-e2e-collection' } });

  const collectionAssignmentHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const collectionAssignmentForm = new FormData();
  appendServerActionFields(collectionAssignmentForm, collectionAssignmentHtml, 'Save collections');
  collectionAssignmentForm.set('collectionId', collection.id);
  const collectionAssignmentResponse = await submitServerAction(productPath, collectionAssignmentForm, adminJar);
  assertRedirect(collectionAssignmentResponse, `${productPath}?status=product-collections-updated`);
  assert.equal(await fixture.prisma.productCollection.count({ where: { productId: fixture.productId, collectionId: collection.id } }), 1);

  const createVariantHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const createVariantForm = new FormData();
  appendServerActionFields(createVariantForm, createVariantHtml, 'Create variant');
  createVariantForm.set('name', 'API E2E Premium Variant');
  createVariantForm.set('sku', 'API-E2E-PREMIUM-001');
  createVariantForm.set('price', '1750');
  createVariantForm.set('currency', 'TOMAN');
  createVariantForm.set('stockQuantity', '8');
  createVariantForm.set('trackInventory', 'on');
  createVariantForm.set('lowStockThreshold', '2');
  createVariantForm.set('sortOrder', '5');
  createVariantForm.set('variantSelectedMediaUrl', '');
  createVariantForm.set('variantImageUrl', 'https://example.com/api-e2e-variant.jpg');
  createVariantForm.set('isActive', 'on');
  const createVariantResponse = await submitServerAction(productPath, createVariantForm, adminJar);
  assertRedirect(createVariantResponse, `${productPath}?status=product-variant-created`);
  const createdVariant = await fixture.prisma.productVariant.findUniqueOrThrow({ where: { sku: 'API-E2E-PREMIUM-001' } });
  assert.equal(createdVariant.priceCents, 175000);
  assert.equal(createdVariant.stockQuantity, 8);

  const variantValueHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const variantValueForm = new FormData();
  appendServerActionFields(variantValueForm, variantValueHtml, `attributeValue:${attribute.id}`, 'last');
  variantValueForm.set('attributeId', attribute.id);
  variantValueForm.set(`attributeValue:${attribute.id}`, 'Pink');
  const variantValueResponse = await submitServerAction(productPath, variantValueForm, adminJar);
  assertRedirect(variantValueResponse, `${productPath}?status=product-attribute-values-updated`);
  const variantAttributeValue = await fixture.prisma.productAttributeValue.findUniqueOrThrow({
    where: { attributeId_variantId: { attributeId: attribute.id, variantId: createdVariant.id } }
  });
  assert.equal(variantAttributeValue.value, 'Pink');

  const location = await fixture.prisma.warehouseLocation.findFirstOrThrow({ orderBy: { createdAt: 'asc' } });
  const stockHtml = await responseText(await request(productPath, { headers: { cookie: adminJar.header() } }));
  const stockForm = new FormData();
  appendServerActionFields(stockForm, stockHtml, `value="${location.id}"`, 'last');
  stockForm.set('locationId', location.id);
  stockForm.set('quantity', '12');
  stockForm.set('reservedQuantity', '1');
  stockForm.set('lowStockThreshold', '3');
  const stockResponse = await submitServerAction(productPath, stockForm, adminJar);
  assertRedirect(stockResponse, `${productPath}?status=variant-location-stock-updated`);
  const locationStock = await fixture.prisma.productVariantLocationStock.findUniqueOrThrow({
    where: { variantId_locationId: { variantId: createdVariant.id, locationId: location.id } }
  });
  assert.equal(locationStock.quantity, 12);
  assert.equal(locationStock.reservedQuantity, 1);
  assert.equal((await fixture.prisma.productVariant.findUniqueOrThrow({ where: { id: createdVariant.id } })).stockQuantity, 12);

  await expectHtml(productPath, 200, ['API E2E Catalog Product Updated', 'API E2E Premium Variant', 'API E2E Collection'], adminJar);
}
