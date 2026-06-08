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

export async function runAdminHomepageMerchandisingActionTests(fixture: ApiFixture) {
  await fixture.prisma.product.deleteMany({ where: { slug: 'api-e2e-homepage-featured-product' } });
  await fixture.prisma.category.deleteMany({ where: { slug: 'api-e2e-homepage-occasion' } });

  const category = await fixture.prisma.category.create({
    data: {
      title: 'API E2E Homepage Occasion',
      slug: 'api-e2e-homepage-occasion',
      eyebrow: 'API E2E Occasion',
      description: 'API E2E homepage occasion tile description.',
      imageUrl: 'https://example.com/api-e2e-homepage-occasion.jpg',
      showOnHomepage: false,
      sortOrder: 300,
      isActive: true
    }
  });
  const product = await fixture.prisma.product.create({
    data: {
      title: 'API E2E Homepage Featured Product',
      slug: 'api-e2e-homepage-featured-product',
      code: 'API-E2E-HOMEPAGE-FEATURED',
      description: 'API E2E homepage featured product.',
      priceCents: 9900,
      currency: 'CAD',
      imageUrl: 'https://example.com/api-e2e-homepage-featured.jpg',
      categoryId: category.id,
      availableToday: true,
      bestSeller: false,
      isActive: true,
      sortOrder: 300
    }
  });

  const adminJar = createAdminCookieJar();
  const homepagePath = '/admin/homepage';
  let html = await responseText(await request(homepagePath, { headers: { cookie: adminJar.header() } }));

  const addCategoryForm = new FormData();
  appendServerActionFields(addCategoryForm, html, 'Add another category to homepage');
  addCategoryForm.set('categoryId', category.id);
  addCategoryForm.set('sortOrder', '6');
  const addCategoryResponse = await submitServerAction(homepagePath, addCategoryForm, adminJar);
  assertRedirect(addCategoryResponse, '/admin/homepage?status=homepage-category-added');

  let savedCategory = await fixture.prisma.category.findUniqueOrThrow({ where: { id: category.id } });
  assert.equal(savedCategory.showOnHomepage, true);
  assert.equal(savedCategory.sortOrder, 6);

  html = await responseText(await request(homepagePath, { headers: { cookie: adminJar.header() } }));
  const updateCategoryForm = new FormData();
  appendServerActionFields(updateCategoryForm, html, 'API E2E Homepage Occasion');
  updateCategoryForm.set('title', 'API E2E Homepage Occasion Updated');
  updateCategoryForm.set('slug', 'api-e2e-homepage-occasion');
  updateCategoryForm.set('eyebrow', 'API E2E Updated Occasion');
  updateCategoryForm.set('description', 'API E2E updated homepage occasion tile.');
  updateCategoryForm.set('selectedMediaUrl', '');
  updateCategoryForm.set('imageUrl', 'https://example.com/api-e2e-homepage-occasion-updated.jpg');
  updateCategoryForm.set('parentId', '');
  updateCategoryForm.set('showOnHomepage', 'on');
  updateCategoryForm.set('isActive', 'on');
  updateCategoryForm.set('sortOrder', '1');
  updateCategoryForm.set('occasionPage', '1');
  const updateCategoryResponse = await submitServerAction(homepagePath, updateCategoryForm, adminJar);
  assertRedirect(updateCategoryResponse, '/admin/homepage?status=homepage-category-updated');

  savedCategory = await fixture.prisma.category.findUniqueOrThrow({ where: { id: category.id } });
  assert.equal(savedCategory.title, 'API E2E Homepage Occasion Updated');
  assert.equal(savedCategory.imageUrl, 'https://example.com/api-e2e-homepage-occasion-updated.jpg');
  assert.equal(savedCategory.sortOrder, 1);

  html = await responseText(await request(homepagePath, { headers: { cookie: adminJar.header() } }));
  const removeCategoryForm = new FormData();
  appendServerActionFields(removeCategoryForm, html, 'Remove from homepage');
  removeCategoryForm.set('occasionPage', '1');
  const removeCategoryResponse = await submitServerAction(homepagePath, removeCategoryForm, adminJar);
  assertRedirect(removeCategoryResponse, '/admin/homepage?status=homepage-category-removed');
  savedCategory = await fixture.prisma.category.findUniqueOrThrow({ where: { id: category.id } });
  assert.equal(savedCategory.showOnHomepage, false);

  html = await responseText(await request(homepagePath, { headers: { cookie: adminJar.header() } }));
  const addFeaturedForm = new FormData();
  appendServerActionFields(addFeaturedForm, html, 'Add another product to featured picks');
  addFeaturedForm.set('productId', product.id);
  addFeaturedForm.set('sortOrder', '5');
  const addFeaturedResponse = await submitServerAction(homepagePath, addFeaturedForm, adminJar);
  assertRedirect(addFeaturedResponse, '/admin/homepage?status=homepage-featured-added');

  let savedProduct = await fixture.prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  assert.equal(savedProduct.bestSeller, true);
  assert.equal(savedProduct.sortOrder, 5);

  assert.ok(savedProduct.isActive);
}
