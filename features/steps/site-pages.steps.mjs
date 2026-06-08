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

When('我打开关于页面', function () {
  this.html = readDist('about/index.html');
  this.page = load(this.html);
});

Then('关于页面展示作者名字和写作原则', function () {
  assert.match(this.html, /Hao Qian/);
  assert.match(this.html, /写作原则/);
});

Then('关于页面链接到作者的 GitHub 主页', function () {
  const hrefs = this.page('a')
    .map((_, element) => this.page(element).attr('href') ?? '')
    .toArray();
  assert.ok(
    hrefs.some((href) => href.includes('github.com/qianhaoq')),
    `Expected an author GitHub link on the about page. Found: ${hrefs.join(', ')}`
  );
});

When('我打开未找到页面', function () {
  this.html = readDist('404.html');
  this.page = load(this.html);
});

Then('未找到页面说明页面已丢失', function () {
  assert.match(this.html, /页面未找到/);
});

Then('未找到页面提供回到文章列表和首页的链接', function () {
  const hrefs = this.page('a')
    .map((_, element) => this.page(element).attr('href') ?? '')
    .toArray();
  assert.ok(hrefs.includes('/posts/'), `Expected a link to /posts/. Found: ${hrefs.join(', ')}`);
  assert.ok(hrefs.includes('/'), `Expected a link to the homepage. Found: ${hrefs.join(', ')}`);
});

When('我打开归档页面', function () {
  this.html = readDist('archive/index.html');
});

Then('归档把已发布的起始文章归到其所属年份下', function () {
  // Prove the archive groups posts under a year heading and lists the starter, without
  // pinning a specific year that breaks when the starter post's pubDate changes.
  assert.match(this.html, /<h2>\d{4}<\/h2>/);
  assert.match(this.html, new RegExp(starterTitle));
});

Then('归档不暴露草稿样例', function () {
  assert.doesNotMatch(this.html, draftMarker);
});

When('我打开起始文章标签的标签详情页', function () {
  // "AI Coding" is slugified to "ai-coding"; the page lists posts carrying that tag.
  this.html = readDist('tags/ai-coding/index.html');
});

Then('标签详情页列出已发布的起始文章及其文章数', function () {
  assert.match(this.html, /<h1>AI Coding<\/h1>/);
  assert.match(this.html, new RegExp(starterTitle));
  // Assert the count is rendered and covers the starter post, without freezing it to the
  // current sample size — adding more "AI Coding" posts must not break this contract.
  const countMatch = this.html.match(/(\d+) 篇文章/);
  assert.ok(countMatch, 'Expected a post count on the tag detail page.');
  assert.ok(Number(countMatch[1]) >= 1, `Expected at least one post on the tag page, saw ${countMatch?.[1]}.`);
});

Then('不为纯草稿标签生成任何公开标签页', function () {
  // The draft sample's only tag is "Draft"; drafts are excluded, so no tag page exists.
  assert.ok(!distExists('tags/draft'), 'Draft-only tag must not produce a public tag page.');
  assert.ok(!distExists('tags/Draft'), 'Draft-only tag must not produce a public tag page.');
});
