import { expect, test } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';

test.describe('Golara API-backed browser journeys', () => {
  test('storefront product to cart journey renders and mutates through server actions', async ({ page }) => {
    await page.goto(`${baseURL}/products/e2e-red-rose-bouquet`);
    await expect(page.getByRole('heading', { name: /API E2E Catalog Product Updated|E2E Red Rose Bouquet/i })).toBeVisible();

    const addToCart = page.getByRole('button', { name: /add to cart|add/i }).first();
    await expect(addToCart).toBeVisible();
    await addToCart.click();
    await page.waitForURL(/cart=|\/cart/);

    await page.goto(`${baseURL}/cart`);
    await expect(page.getByText(/E2E Red Rose Bouquet|API E2E Catalog Product Updated/i)).toBeVisible();
  });

  test('admin login and protected order surface render with session cookie', async ({ page }) => {
    await page.goto(`${baseURL}/admin/login`);
    await page.getByLabel(/password/i).fill(process.env.ADMIN_PASSWORD || 'golara-admin-local');
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
    await page.waitForURL(/\/admin/);
    await expect(page.getByText(/Admin|Dashboard|Orders/i).first()).toBeVisible();

    await page.goto(`${baseURL}/admin/orders`);
    await expect(page.getByText(/Orders/i).first()).toBeVisible();
  });
});
