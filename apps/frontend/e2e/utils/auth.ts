import { expect, Page } from '@playwright/test';

interface ExpectProtectedRouteRedirectArgs {
  page: Page;
  protectedPath: string;
}

export async function expectProtectedRouteRedirect({
  page,
  protectedPath,
}: ExpectProtectedRouteRedirectArgs) {
  await page.goto(protectedPath, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login\?/);

  const currentUrl = new URL(page.url());
  expect(currentUrl.pathname).toBe('/login');
  expect(currentUrl.searchParams.get('redirect_url')).toBe(protectedPath);
}

interface ExpectAuthPageArgs {
  page: Page;
  path: string;
  heading: string | RegExp;
  primaryButtonName: string | RegExp;
}

export async function expectAuthPage({
  page,
  path,
  heading,
  primaryButtonName,
}: ExpectAuthPageArgs) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });

  const currentUrl = new URL(page.url());
  expect(currentUrl.pathname).toBe(path);

  const headingLocator =
    typeof heading === 'string'
      ? page.getByRole('heading', { name: heading, exact: true })
      : page.getByRole('heading', { name: heading });

  await expect(headingLocator).toBeVisible();
  await expect(
    page.getByRole('button', { name: primaryButtonName }),
  ).toBeVisible();
}
