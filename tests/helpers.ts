import { Page } from '@playwright/test';
import { Role, User } from '../src/service/pizzaService';
import { expect } from 'playwright-test-coverage';

async function basicInit(page: Page) {
    let loggedInUser: User | undefined;

    await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    const validUsers: Record<string, User> = {
        'd@jwt.com': {
            id: '3',
            name: 'Pizza Diner',
            email: 'd@jwt.com',
            password: 'a',
            roles: [{ role: Role.Diner }],
        },
        'a@jwt.com': {
            id: '5',
            name: 'Pizza Admin',
            email: 'a@jwt.com',
            password: 'admin',
            roles: [{ role: Role.Admin }],
        },
    };

    let validFranchises = [
        {
            id: 2,
            name: 'LotaPizza',
            stores: [
                { id: 4, name: 'Lehi' },
                { id: 5, name: 'Springville' },
                { id: 6, name: 'American Fork' },
            ],
        },
        { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
        { id: 4, name: 'topSpot', stores: [] },
    ];

    // Authorize login for the given user
    await page.route('*/**/api/auth', async (route) => {
        if (route.request().method() === 'DELETE') {
            loggedInUser = undefined;
            await route.fulfill({ json: { message: 'logged out successfully' } });
            return;
        }
        const loginReq = route.request().postDataJSON();
        const user = validUsers[loginReq.email];
        if (!user || user.password !== loginReq.password) {
            await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
            return;
        }
        loggedInUser = validUsers[loginReq.email];
        const loginRes = {
            user: loggedInUser,
            token: 'abcdef',
        };
        expect(route.request().method()).toBe('PUT');
        await route.fulfill({ json: loginRes });
    });

    // Return the currently logged in user
    await page.route('*/**/api/user/me', async (route) => {
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: loggedInUser });
    });

    // A standard menu
    await page.route('*/**/api/order/menu', async (route) => {
        const menuRes = [
            {
                id: 1,
                title: 'Veggie',
                image: 'pizza1.png',
                price: 0.0038,
                description: 'A garden of delight',
            },
            {
                id: 2,
                title: 'Pepperoni',
                image: 'pizza2.png',
                price: 0.0042,
                description: 'Spicy treat',
            },
        ];
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: menuRes });
    });

    // Create a franchise
    await page.route(/\/api\/franchise$/, async (route) => {
        expect(route.request().method()).toBe('POST');
        const franchiseReq = route.request().postDataJSON();
        expect(franchiseReq.admins[0].email).toBe(loggedInUser?.email);
        expect(franchiseReq.name).toBe('newFranchise');
        const newFranchise = {
            name: franchiseReq.name,
            id: 8,
            admins: [
                {
                    name: loggedInUser?.name,
                    email: franchiseReq.admins[0].email,
                    id: loggedInUser?.id,
                },
            ],
        };
        validFranchises.push({ ...newFranchise, stores: [] });
        await route.fulfill({ json: newFranchise });
    });

    // Delete a franchise
    await page.route(/\/api\/franchise\/(\d)$/, async (route) => {
        expect(route.request().method()).toBe('DELETE');
        const franchiseId = route.request().url().split('/').pop();
        if (franchiseId) {
            validFranchises = validFranchises.filter((f) => f.id !== parseInt(franchiseId));
            await route.fulfill({ json: { message: 'franchise deleted' } });
            return;
        } else {
            await route.fulfill({ status: 400, json: { error: 'missing franchise id' } });
        }
    });

    // Get franchises
    await page.route(/\/api\/franchise(\?.*)$/, async (route) => {
        const franchiseRes = {
            franchises: validFranchises,
        };
        expect(route.request().method()).toBe('GET');
        await route.fulfill({ json: franchiseRes });
    });

    // Order a pizza.
    await page.route('*/**/api/order', async (route) => {
        const orderReq = route.request().postDataJSON();
        const orderRes = {
            order: { ...orderReq, id: 23 },
            jwt: 'eyJpYXQ',
        };
        expect(route.request().method()).toBe('POST');
        await route.fulfill({ json: orderRes });
    });

    await page.goto('/');
}

export { basicInit };
