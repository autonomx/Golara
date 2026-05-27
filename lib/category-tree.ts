import type { Category, Product } from '@/lib/catalog';

export function childCategoriesFor(category: Category, categories: Category[]) {
  return categories.filter((candidate) => candidate.parentSlug === category.slug && candidate.isActive !== false);
}

export function descendantCategoriesFor(category: Category, categories: Category[]) {
  const descendants: Category[] = [];
  const queue = childCategoriesFor(category, categories);
  const seen = new Set<string>([category.slug]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.slug)) continue;
    seen.add(current.slug);
    descendants.push(current);
    queue.push(...childCategoriesFor(current, categories));
  }

  return descendants;
}

export function productsForCategoryTree(category: Category, categories: Category[], products: Product[]) {
  const descendants = descendantCategoriesFor(category, categories);
  const categorySlugs = new Set([category.slug, ...descendants.map((child) => child.slug)]);
  return products.filter((product) => categorySlugs.has(product.category));
}

export function categoryProductCount(category: Category, categories: Category[], products: Product[]) {
  return productsForCategoryTree(category, categories, products).length;
}

export function withCategoryProductCounts(categories: Category[], products: Product[]) {
  return categories.map((category) => ({
    ...category,
    productCount: categoryProductCount(category, categories, products)
  }));
}
