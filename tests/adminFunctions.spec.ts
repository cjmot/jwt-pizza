import { test, expect } from 'playwright-test-coverage';
import { Page } from '@playwright/test';
import { basicInit } from './helpers';

async function loginAsAdminAndOpenDashboard(page: Page) {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Admin' }).click();
}

test('create and close franchise', async ({ page }) => {
    await basicInit(page);

    await loginAsAdminAndOpenDashboard(page);

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

    await loginAsAdminAndOpenDashboard(page);

    // Close Spanish Fork store
    await page.getByRole('row', { name: 'Lehi 450 ₿ Close' }).getByRole('button').click();
    await expect(page.getByRole('main')).toContainText(
        'Are you sure you want to close the LotaPizza store Lehi ? This cannot be restored. All outstanding revenue will not be refunded.',
    );
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('cell', { name: 'Lehi' })).toHaveCount(0);
});

test('admin can switch between franchises and users lists', async ({ page }) => {
    await basicInit(page);
    await loginAsAdminAndOpenDashboard(page);

    await expect(page.getByRole('button', { name: 'Franchises' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'LotaPizza' })).toBeVisible();

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pizza Admin' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'a@jwt.com' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Franchise' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Franchises' }).click();
    await expect(page.getByRole('cell', { name: 'LotaPizza' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Franchise' })).toBeVisible();
});

test('admin can filter users list by name and email', async ({ page }) => {
    await basicInit(page);
    await loginAsAdminAndOpenDashboard(page);

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('cell', { name: 'Pizza Admin' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pizza Diner' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pizza Franchisee' })).toBeVisible();

    await page.getByPlaceholder('Filter users').fill('franchisee');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('cell', { name: 'Pizza Franchisee' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pizza Admin' })).toHaveCount(0);

    await page.getByPlaceholder('Filter users').fill('a@jwt.com');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('cell', { name: 'a@jwt.com' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'f@jwt.com' })).toHaveCount(0);
});

test('users list has no close actions and list filter resets when switching back', async ({
    page,
}) => {
    await basicInit(page);
    await loginAsAdminAndOpenDashboard(page);

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('button', { name: 'Close' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add Franchise' })).toHaveCount(0);

    await page.getByPlaceholder('Filter users').fill('franchisee');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('cell', { name: 'Pizza Franchisee' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pizza Admin' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Franchises' }).click();
    await expect(page.getByPlaceholder('Filter franchises')).toHaveValue('');
    await expect(page.getByRole('cell', { name: 'LotaPizza' })).toBeVisible();
});

test('admin can delete a user from users list', async ({ page }) => {
    await basicInit(page);
    await loginAsAdminAndOpenDashboard(page);

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('cell', { name: 'Pizza Diner' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'd@jwt.com' })).toBeVisible();

    await page
        .getByRole('row', { name: 'Pizza Diner d@jwt.com Delete' })
        .getByRole('button', { name: 'Delete' })
        .click();
    await expect(page.getByText('Are you sure you want to delete user')).toBeVisible();
    await expect(page.getByText('Pizza Diner')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('cell', { name: 'Pizza Diner' })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'd@jwt.com' })).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'Pizza Admin' })).toBeVisible();
});

test('admin can cancel delete user and keep user in list', async ({ page }) => {
    await basicInit(page);
    await loginAsAdminAndOpenDashboard(page);

    await page.getByRole('button', { name: 'Users' }).click();
    await page
        .getByRole('row', { name: 'Pizza Diner d@jwt.com Delete' })
        .getByRole('button', { name: 'Delete' })
        .click();

    await expect(page.getByText('Are you sure you want to delete user')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page.getByRole('cell', { name: 'Pizza Diner' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'd@jwt.com' })).toBeVisible();
});
