import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const getStarterPostPath = async (page: Page) => {
  await page.goto('/posts/');
  const href = await page.getByRole('link', { name: '这个博客从这里开始' }).first().getAttribute('href');
  expect(href).toBeTruthy();
  return href ?? '/posts/';
};

test('reader entry keeps drafts private and renders responsive navigation', async ({ page }, testInfo) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Hao Qian' })).toBeVisible();
  await expect(page.getByRole('link', { name: '文章', exact: true })).toBeVisible();
  await expect(page.getByText('这个博客从这里开始')).toBeVisible();
  await expect(page.getByText('草稿示例')).toHaveCount(0);

  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
});

test('article page exposes table of contents, reading progress, and copy interaction', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-write']);
  await page.goto(await getStarterPostPath(page));

  await expect(page.getByRole('heading', { name: '这个博客从这里开始' })).toBeVisible();
  await expect(page.getByLabel('文章目录')).toContainText('为什么建这个站点');

  const copyButton = page.getByRole('button', { name: '复制代码' });
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(copyButton).toHaveText('已复制');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(async () => page.locator('.reading-progress').evaluate((bar) => {
    const transform = window.getComputedStyle(bar).transform;
    if (transform === 'none') return 0;
    return new DOMMatrixReadOnly(transform).a;
  })).toBeGreaterThan(0.5);
});

test('theme toggle and search work against the built Pagefind index', async ({ page }) => {
  await page.goto('/');
  const initialTheme = await page.locator('html').getAttribute('data-theme');

  await page.getByRole('button', { name: '切换明暗主题' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', initialTheme ?? '');

  await page.goto('/search/');
  await expect(page.getByText('搜索已就绪。')).toBeVisible();
  await page.getByLabel('关键词').fill('AI Coding');
  await expect(page.getByText('这个博客从这里开始')).toBeVisible();
});
