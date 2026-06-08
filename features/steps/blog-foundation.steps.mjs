import { Given, Then, When } from '@cucumber/cucumber';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const distDir = path.resolve('dist');
const starterPostPath = 'posts/2026-06-05-start-here/index.html';

const readDist = (relativePath) => readFileSync(path.join(distDir, relativePath), 'utf8');

Given('生产站点已构建', function () {
  assert.ok(existsSync(path.join(distDir, 'index.html')), 'Run pnpm build before pnpm bdd.');
  assert.ok(existsSync(path.join(distDir, starterPostPath)), 'Expected starter post page to exist.');
});

When('我检查公开博客入口', function () {
  const publicEntryPoints = [
    'index.html',
    'posts/index.html',
    starterPostPath,
    'tags/index.html',
    'archive/index.html',
    'rss.xml',
    'sitemap-0.xml'
  ];

  this.publicText = publicEntryPoints
    .filter((relativePath) => existsSync(path.join(distDir, relativePath)))
    .map(readDist)
    .join('\n');
});

Then('已发布的起始文章可访问', function () {
  assert.match(this.publicText, /这个博客从这里开始/);
  assert.match(this.publicText, /\/posts\/2026-06-05-start-here\//);
});

Then('首页可见部署验证信号', function () {
  const homepage = readDist('index.html');
  assert.match(homepage, /部署验证/);
});

Then('草稿样例不出现在公开页面', function () {
  assert.doesNotMatch(this.publicText, /草稿示例|draft-note|Draft/);
});

When('我检查搜索、订阅源和 sitemap 产物', function () {
  const fragmentDir = path.join(distDir, 'pagefind', 'fragment');
  const fragmentFiles = readdirSync(fragmentDir).filter((file) => file.endsWith('.pf_fragment'));
  const pagefindFragments = fragmentFiles
    .map((file) => gunzipSync(readFileSync(path.join(fragmentDir, file))).toString('utf8'))
    .join('\n');

  this.searchText = pagefindFragments;
  this.rss = load(readDist('rss.xml'), { xmlMode: true });
  this.sitemap = load(readDist('sitemap-0.xml'), { xmlMode: true });
});

Then('Pagefind 已索引已发布的起始文章', function () {
  assert.match(this.searchText, /这个博客从这里开始/);
  assert.match(this.searchText, /\/posts\/2026-06-05-start-here\//);
  assert.doesNotMatch(this.searchText, /草稿示例|draft-note|Draft/);
});

Then('RSS 包含已发布的起始文章', function () {
  const item = this.rss('item').first();
  assert.equal(item.find('title').text(), '这个博客从这里开始');
  assert.equal(item.find('link').text(), 'https://qianhaoq.github.io/posts/2026-06-05-start-here/');
});

Then('sitemap 包含已发布的起始文章', function () {
  const urls = this.sitemap('url loc')
    .map((_, element) => this.sitemap(element).text())
    .toArray();

  assert.ok(
    urls.includes('https://qianhaoq.github.io/posts/2026-06-05-start-here/'),
    `Expected starter post in sitemap. Found: ${urls.join(', ')}`
  );
});
