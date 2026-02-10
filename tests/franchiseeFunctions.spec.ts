import { test, expect } from 'playwright-test-coverage';
import { basicInit } from './helpers';

test('create and close store as franchisee', async ({ page }) => {
    await basicInit(page);

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('f@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('f');
    await page.getByRole('button', { name: 'Login' }).click();
    await page
        .getByRole('navigation', { name: 'Global' })
        .getByRole('link', { name: 'Franchise' })
        .click();
    await expect(page.getByText('LotaPizza')).toBeVisible();
    await expect(page.getByText('Lehi')).toBeVisible();

    // Create and close new store
    await page.getByRole('button', { name: 'Create store' }).click();
    await expect(page.getByText('Create store')).toBeVisible();
    await page.getByRole('textbox', { name: 'store name' }).fill('newStore');
    await page.getByRole('button', { name: 'Create' }).click();
    await Promise.all([page.waitForResponse((r) => r.url().includes('/api/franchise'))]);
    await expect(page.locator('tbody')).toContainText('newStore');
    await page.getByRole('row', { name: 'newStore 0 ₿ Close' }).getByRole('button').click();
    await expect(page.getByRole('main')).toContainText(
        'Are you sure you want to close the LotaPizza store newStore ? This cannot be restored. All outstanding revenue will not be refunded.',
    );
    await page.getByRole('button', { name: 'Close' }).click();
    await Promise.all([page.waitForResponse((r) => r.url().includes('/api/franchise'))]);
    await expect(page.locator('tbody')).not.toContainText('newStore');
});
