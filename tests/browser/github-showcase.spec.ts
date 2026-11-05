import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const snapshot = JSON.parse(readFileSync('src/data/github.json', 'utf8'));

test('GitHub projects and charts are readable without runtime API requests', async ({ page }, testInfo) => {
  const apiRequests: string[] = [];
  await page.route('https://api.github.com/**', route => { apiRequests.push(route.request().url()); return route.abort(); });
  await page.goto('/');
  await page.getByRole('link', { name: 'GitHub 项目', exact: true }).click();
  const section = page.getByRole('region', { name: '在 GitHub 上实践' });
  await expect(section.getByRole('heading', { name: '在 GitHub 上实践' })).toBeVisible();
  await expect(section.locator('.project-card')).toHaveCount(6);
  await expect(section.getByRole('heading', { name: '主语言分布' })).toBeVisible();
  expect(await section.locator('[data-language-count]').evaluateAll(rows => rows.reduce((sum, row) => sum + Number(row.getAttribute('data-language-count')), 0))).toBe(snapshot.repositories.length);
  expect(await section.locator('[data-recency-count]').evaluateAll(rows => rows.reduce((sum, row) => sum + Number(row.getAttribute('data-recency-count')), 0))).toBe(snapshot.repositories.length);
  await expect(section.locator('[data-snapshot-time]')).toHaveAttribute('datetime', snapshot.fetchedAt);
  await section.getByText('数据来源、更新方式与边界', { exact: true }).click();
  await expect(section.getByRole('link', { name: 'GitHub 公开仓库 API' })).toBeVisible();
  await section.getByText('数据来源、更新方式与边界', { exact: true }).click();
  expect(apiRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Capture actual viewports and a full page from the top; element captures can
  // place the sticky navigation in the middle of tall screenshots.
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.screenshot({ path: testInfo.outputPath('homepage-light.png'), fullPage: true });
  const scrollToContent = async (selector: string) => page.locator(selector).evaluate(element => {
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 140);
  });
  await scrollToContent('#github');
  await page.screenshot({ path: testInfo.outputPath('github-light.png') });
  await scrollToContent('.github-data-heading');
  await page.screenshot({ path: testInfo.outputPath('charts-light.png') });
  await page.getByRole('button', { name: '切换明暗主题' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: testInfo.outputPath('charts-dark.png') });
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('homepage-dark.png'), fullPage: true });
});

test('GitHub snapshot remains accessible when JavaScript is disabled', async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize() });
  const staticPage = await context.newPage();
  await staticPage.goto('/#github');
  await expect(staticPage.getByRole('heading', { name: '主语言分布' })).toBeVisible();
  await expect(staticPage.locator('.project-card')).toHaveCount(6);
  await expect(staticPage.locator('.freshness-note')).toContainText('30 天');
  await context.close();
});

test('an old static snapshot is clearly labeled even without rebuilding Pages', async ({ page }) => {
  await page.clock.install({ time: new Date(Date.parse(snapshot.fetchedAt) + 31 * 86_400_000) });
  await page.goto('/#github');
  await expect(page.locator('[data-snapshot-status]')).toHaveText('历史快照 · 请核对 GitHub');
  await expect(page.locator('[data-snapshot-status]')).toHaveAttribute('data-stale', 'true');
  await expect(page.locator('[data-language-count]')).not.toHaveCount(0);
});
