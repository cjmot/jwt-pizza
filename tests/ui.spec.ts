import { test, expect } from 'playwright-test-coverage';

test('history, about, docs', async ({ page }) => {
    await page.goto('/');
    // About
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByText('The secret sauce')).toBeVisible();
    await expect(page.getByRole('img').nth(3)).toBeVisible();

    // History
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText('Mama Rucci, my my')).toBeVisible();
    await expect(page.getByRole('main').getByRole('img')).toBeVisible();

    // Docs
    await page.goto('/docs');
    await expect(page.getByText('JWT Pizza API')).toBeVisible();
});
