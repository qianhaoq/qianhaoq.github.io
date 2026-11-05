import { When, Then } from '@cucumber/cucumber';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

When('我阅读首页的 GitHub 区域', function () {
  this.home = load(readFileSync('dist/index.html', 'utf8'));
  this.github = this.home('#github');
  this.snapshot = JSON.parse(readFileSync('src/data/github.json', 'utf8'));
});

Then('首页保留既有文章和主题入口', function () {
  assert.match(this.home('main').text(), /最近文章/);
  assert.match(this.home('main').text(), /主题入口/);
  assert.ok(this.home('a[href="/posts/"]').length);
  assert.ok(this.home('a[href="/tags/"]').length);
});

Then('展示的项目都链接到公开数据快照中的仓库', function () {
  const links = this.github.find('.project-card h3 a');
  assert.ok(links.length > 0);
  for (const link of links.toArray()) {
    assert.ok(this.snapshot.repositories.some(repo => repo.url === this.home(link).attr('href')));
  }
  assert.equal(this.home('a[href*="/qianhao-ai-site"]').length, 0);
});

Then('图表标注主语言仓库数量的口径和数据来源', function () {
  assert.match(this.github.text(), /公开、非 fork、非归档/);
  assert.match(this.github.text(), /不是代码量、贡献量或能力评分/);
  assert.equal(this.github.find(`a[href="${this.snapshot.source}"]`).length, 1);
  const rows = this.github.find('[data-language-count]');
  const total = rows.toArray().reduce((sum, row) => sum + Number(this.home(row).attr('data-language-count')), 0);
  assert.equal(total, this.snapshot.repositories.length);
  const recencyTotal = this.github.find('[data-recency-count]').toArray()
    .reduce((sum, row) => sum + Number(this.home(row).attr('data-recency-count')), 0);
  assert.equal(recencyTotal, total);
});

Then('首页显示快照更新时间和失效说明', function () {
  assert.equal(this.github.find('time[data-snapshot-time]').attr('datetime'), this.snapshot.fetchedAt);
  assert.match(this.github.text(), /30 天/);
  assert.match(this.github.text(), /静态快照/);
});

Then('GitHub 区域不依赖第三方图像或在线 API', function () {
  assert.equal(this.github.find('img, iframe').length, 0);
  const html = readFileSync('dist/index.html', 'utf8');
  assert.doesNotMatch(html, /github-readme-stats|streak-stats|ghchart|api\.github\.com[^<]*fetch\(/);
});
