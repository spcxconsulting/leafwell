import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const width of [375, 768, 1440]) {
  test(`accessible responsive homepage at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const failures = [];
    page.on('pageerror', (error) => failures.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    const outbound = [];
    await page.route('**/*', async (route) => {
      if (!new URL(route.request().url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) {
        outbound.push(route.request().url());
        await route.abort();
      } else await route.continue();
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'A little gardening.A lot of good.',
    );
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll('main *')]
        .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
        .map((element) => ({
          tag: element.tagName,
          class: element.className,
          width: element.getBoundingClientRect().width,
        }))
        .slice(0, 15),
    }));
    expect(layout, JSON.stringify(layout)).toMatchObject({ scrollWidth: width });
    expect(
      await page
        .locator('img')
        .evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)),
    ).toBeTruthy();
    await expect(page.locator('#enquiry-placeholder fieldset')).toHaveAttribute('disabled', '');
    await expect(page.locator('#full-name')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Enquiries opening soon' })).toBeDisabled();
    await page.locator('[data-enquiry="workplace"]').click();
    await expect(page.locator('#enquiry-type')).toHaveValue('workplace');
    await expect(page.locator('#enquire')).toBeInViewport();
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    expect(failures).toEqual([]);
    expect(outbound).toEqual([]);
    await page.screenshot({ path: `test-results/enquiry-${width}.png`, fullPage: true });
  });
}
test('mobile navigation supports keyboard, Escape and anchor links', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation').getByRole('link', { name: 'Our programs' }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#programs')).toBeInViewport();
});
test('privacy, static assets, crawler controls and real 404 handling', async ({
  page,
  request,
}) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  expect((await request.get('/robots.txt')).status()).toBe(200);
  expect((await request.get('/sitemap.xml')).status()).toBe(200);
  expect((await request.get('/does-not-exist')).status()).toBe(404);
  expect((await request.post('/api/enquiry', { data: 'synthetic smoke check' })).ok()).toBeFalsy();
});
test('navigation and content remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8787');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Our story' })).toBeVisible();
  await expect(page.locator('#full-name')).toBeDisabled();
  await context.close();
});
