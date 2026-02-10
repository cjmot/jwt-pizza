import { test, expect } from 'playwright-test-coverage';
import { basicInit } from './helpers';

test('create and close franchise', async ({ page }) => {
    await basicInit(page);

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();

    // Admin page
    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByText("Mama Ricci's kitchen")).toBeVisible();
    await expect(page.getByText('LotaPizza')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Lehi' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Springville' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'American Fork' })).toBeVisible();

    // Create franchise
    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).click();
    await page.getByRole('textbox', { name: 'franchise name' }).fill('newFranchise');
    await page.getByRole('textbox', { name: 'franchisee admin email' }).click();
    await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('a@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();
    await Promise.all([
        page.waitForRequest((r) => r.url().includes('/api/franchise') && r.method() === 'GET'),
    ]);
    await expect(page.getByRole('cell', { name: 'newFranchise' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pizza Admin' })).toBeVisible();
    await page
        .getByRole('row', { name: 'newFranchise Pizza Admin Close' })
        .getByRole('button')
        .click();
    await expect(page.getByText('Sorry to see you go')).toBeVisible();
    await expect(page.getByText('newFranchise')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('cell', { name: 'LotaPizza' })).toBeVisible();
});

test('create and close store as admin', async ({ page }) => {
    await basicInit(page);

    // Login and go to admin page
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();

    // Close Spanish Fork store
    await page.getByRole('row', { name: 'Lehi ₿ Close' }).getByRole('button').click();
    await expect(page.getByRole('main')).toContainText(
        'Are you sure you want to close the LotaPizza store Lehi ? This cannot be restored. All outstanding revenue will not be refunded.',
    );
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('cell', { name: 'Lehi' })).toHaveCount(0);
});
