import { Then, When } from '@cucumber/cucumber';
import { load } from 'cheerio';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// The shared "the production site has been built" Given lives in blog-foundation.steps.mjs.

const distDir = path.resolve('dist');
const starterTitle = '这个博客从这里开始';
const draftMarker = /草稿示例|draft-note|Draft/;

const readDist = (relativePath) => readFileSync(path.join(distDir, relativePath), 'utf8');
const distExists = (relativePath) => existsSync(path.join(distDir, relativePath));

When('I open the about page', function () {
  this.html = readDist('about/index.html');
  this.page = load(this.html);
});

Then('the about page shows the author name and writing principles', function () {
  assert.match(this.html, /Hao Qian/);
  assert.match(this.html, /写作原则/);
});

Then('the about page links to the author GitHub profile', function () {
  const hrefs = this.page('a')
    .map((_, element) => this.page(element).attr('href') ?? '')
    .toArray();
  assert.ok(
    hrefs.some((href) => href.includes('github.com/qianhaoq')),
    `Expected an author GitHub link on the about page. Found: ${hrefs.join(', ')}`
  );
});

When('I open the not-found page', function () {
  this.html = readDist('404.html');
  this.page = load(this.html);
});

Then('the not-found page explains the page is missing', function () {
  assert.match(this.html, /页面未找到/);
});

Then('the not-found page offers links back to the posts list and homepage', function () {
  const hrefs = this.page('a')
    .map((_, element) => this.page(element).attr('href') ?? '')
    .toArray();
  assert.ok(hrefs.includes('/posts/'), `Expected a link to /posts/. Found: ${hrefs.join(', ')}`);
  assert.ok(hrefs.includes('/'), `Expected a link to the homepage. Found: ${hrefs.join(', ')}`);
});

When('I open the archive page', function () {
  this.html = readDist('archive/index.html');
});

Then('the archive groups the published starter post under its year', function () {
  assert.match(this.html, /<h2>2026<\/h2>/);
  assert.match(this.html, new RegExp(starterTitle));
});

Then('the archive does not expose the draft sample', function () {
  assert.doesNotMatch(this.html, draftMarker);
});

When('I open the tag detail page for the starter post tag', function () {
  // "AI Coding" is slugified to "ai-coding"; the page lists posts carrying that tag.
  this.html = readDist('tags/ai-coding/index.html');
});

Then('the tag detail page lists the published starter post with its post count', function () {
  assert.match(this.html, /<h1>AI Coding<\/h1>/);
  assert.match(this.html, new RegExp(starterTitle));
  assert.match(this.html, /1 篇文章/);
});

Then('no public tag page is generated for the draft-only tag', function () {
  // The draft sample's only tag is "Draft"; drafts are excluded, so no tag page exists.
  assert.ok(!distExists('tags/draft'), 'Draft-only tag must not produce a public tag page.');
  assert.ok(!distExists('tags/Draft'), 'Draft-only tag must not produce a public tag page.');
});
