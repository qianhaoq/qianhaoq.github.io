import { Given, Then, When } from '@cucumber/cucumber';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const distDir = path.resolve('dist');
const starterPostPath = 'posts/2026-06-05-start-here/index.html';

const readDist = (relativePath) => readFileSync(path.join(distDir, relativePath), 'utf8');

Given('the production site has been built', function () {
  assert.ok(existsSync(path.join(distDir, 'index.html')), 'Run pnpm build before pnpm bdd.');
  assert.ok(existsSync(path.join(distDir, starterPostPath)), 'Expected starter post page to exist.');
});

When('I inspect the public blog entry points', function () {
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

Then('the published starter post is available', function () {
  assert.match(this.publicText, /这个博客从这里开始/);
  assert.match(this.publicText, /\/posts\/2026-06-05-start-here\//);
});

Then('the draft sample is not exposed in public pages', function () {
  assert.doesNotMatch(this.publicText, /草稿示例|draft-note|Draft/);
});

When('I inspect the search, feed, and sitemap artifacts', function () {
  const fragmentDir = path.join(distDir, 'pagefind', 'fragment');
  const fragmentFiles = readdirSync(fragmentDir).filter((file) => file.endsWith('.pf_fragment'));
  const pagefindFragments = fragmentFiles
    .map((file) => gunzipSync(readFileSync(path.join(fragmentDir, file))).toString('utf8'))
    .join('\n');

  this.searchText = pagefindFragments;
  this.rss = load(readDist('rss.xml'), { xmlMode: true });
  this.sitemap = load(readDist('sitemap-0.xml'), { xmlMode: true });
});

Then('Pagefind indexes the published starter post', function () {
  assert.match(this.searchText, /这个博客从这里开始/);
  assert.match(this.searchText, /\/posts\/2026-06-05-start-here\//);
  assert.doesNotMatch(this.searchText, /草稿示例|draft-note|Draft/);
});

Then('RSS includes the published starter post', function () {
  const item = this.rss('item').first();
  assert.equal(item.find('title').text(), '这个博客从这里开始');
  assert.equal(item.find('link').text(), 'https://qianhaoq.github.io/posts/2026-06-05-start-here/');
});

Then('the sitemap includes the published starter post', function () {
  const urls = this.sitemap('url loc')
    .map((_, element) => this.sitemap(element).text())
    .toArray();

  assert.ok(
    urls.includes('https://qianhaoq.github.io/posts/2026-06-05-start-here/'),
    `Expected starter post in sitemap. Found: ${urls.join(', ')}`
  );
});
