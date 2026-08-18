import { expect, test } from '@playwright/test';

import { expectAuthPage, expectProtectedRouteRedirect } from './utils/auth';

test.describe('Auth smoke flows', () => {
  test('redirects signed-out users from protected routes to login', async ({
    page,
  }) => {
    await expectProtectedRouteRedirect({
      page,
      protectedPath: '/dashboard',
    });
  });

  test('renders the forgot-password email step for signed-out users', async ({
    page,
  }) => {
    await expectAuthPage({
      page,
      path: '/forgot-password',
      heading: 'Forgot your password?',
      primaryButtonName: 'Send Reset Code',
    });

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign out current session' }),
    ).toHaveCount(0);
  });

  test('renders the login screen for signed-out users', async ({ page }) => {
    await expectAuthPage({
      page,
      path: '/login',
      heading: 'Welcome back',
      primaryButtonName: 'Sign In',
    });

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Continue with Google' }),
    ).toBeVisible();
  });

  test('renders the register screen for signed-out users', async ({ page }) => {
    await expectAuthPage({
      page,
      path: '/register',
      heading: /^(Start with your story\.|Create account)$/,
      primaryButtonName: 'Create Account',
    });

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(
      page.getByLabel('Confirm password', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Continue with Apple' }),
    ).toBeVisible();
  });

  test('rejects direct navigation to the SSO callback page', async ({
    page,
  }) => {
    await page.goto('/sso-callback', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('redirects retired SSO continuation visits to registration', async ({
    page,
  }) => {
    await page.goto('/sso-continue', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/register$/);
  });
});
