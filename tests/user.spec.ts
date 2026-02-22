import { test, expect } from 'playwright-test-coverage';
import { Page } from '@playwright/test';
import { basicInit } from './helpers';

async function registerDiner(page: Page, email: string, password: string = 'diner') {
    await page.goto('/');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Register' }).click();
}

async function openUserEditModal(page: Page) {
    await page.getByRole('link', { name: 'pd' }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
}

async function logoutAndOpenLogin(page: Page) {
    await page.getByRole('link', { name: 'Logout' }).click();
    await page.getByRole('link', { name: 'Login' }).click();
}

test('updateUser', async ({ page }) => {
    await basicInit(page);
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    await registerDiner(page, email);

    await openUserEditModal(page);
    await page.locator('#hs-jwt-modal input').first().fill('pizza dinerx');
    await page.getByRole('button', { name: 'Update' }).click();

    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText('pizza dinerx');

    await logoutAndOpenLogin(page);

    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('updateUser email persists across logout/login', async ({ page }) => {
    await basicInit(page);
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    const updatedEmail = `updated${Math.floor(Math.random() * 10000)}@jwt.com`;
    await registerDiner(page, email);

    await openUserEditModal(page);
    await page.locator('#hs-jwt-modal input').nth(1).fill(updatedEmail);
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await expect(page.getByRole('main')).toContainText(updatedEmail);

    await logoutAndOpenLogin(page);
    await page.getByRole('textbox', { name: 'Email address' }).fill(updatedEmail);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'pd' }).click();

    await expect(page.getByRole('main')).toContainText(updatedEmail);
});

test('updateUser password invalidates old password', async ({ page }) => {
    await basicInit(page);
    const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
    const newPassword = 'newDinerPass';
    await registerDiner(page, email);

    await openUserEditModal(page);
    await page.locator('#hs-jwt-modal input').nth(2).fill(newPassword);
    await page.getByRole('button', { name: 'Update' }).click();
    await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

    await logoutAndOpenLogin(page);
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('diner');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();

    await page.getByRole('textbox', { name: 'Password' }).fill(newPassword);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'pd' }).click();
    await expect(page.getByRole('main')).toContainText('pizza diner');
});
