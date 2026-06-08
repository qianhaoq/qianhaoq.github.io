import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

Given('the local authoring entry is available', function () {
  assert.ok(existsSync('AUTHORING.md'), 'Expected AUTHORING.md to document the writer entry.');

  this.packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(this.packageJson.scripts.author, 'tsx scripts/author.ts');
  assert.equal(this.packageJson.scripts.write, 'tsx scripts/write-post.ts');
});

When('I inspect the authoring contract', function () {
  this.authoringGuide = readFileSync('AUTHORING.md', 'utf8');
  this.readerNavigation = readFileSync('src/lib/site.ts', 'utf8');
  this.authoringPage = readFileSync('dist/authoring/index.html', 'utf8');
  this.dryRunDraft = JSON.parse(execFileSync(
    'pnpm',
    ['--silent', 'write', 'BDD Authoring Draft', '--dry-run', '--date', '2026-06-06'],
    { encoding: 'utf8' }
  ));
});

Then('the author can start a draft with one command', function () {
  assert.match(this.authoringGuide, /pnpm write "文章标题"/);
  assert.equal(this.dryRunDraft.relativePath, 'src/content/posts/2026-06-06-bdd-authoring-draft.mdx');
});

Then('new authoring posts default to private drafts', function () {
  assert.equal(this.dryRunDraft.draft, true);
  assert.match(this.dryRunDraft.body, /draft: true/);
});

Then('the public reader navigation exposes the writing guide', function () {
  assert.match(this.readerNavigation, /href: '\/authoring\/'/);
  assert.match(this.readerNavigation, /label: '写作指南'/);
});

Then('the writing guide keeps editing in the local workflow', function () {
  assert.match(this.authoringGuide, /公开站点导航里可以提供“写作指南”入口/);
  assert.match(this.authoringPage, /pnpm write "文章标题"/);
  assert.match(this.authoringPage, /真实编辑仍在本地仓库和 GitHub 工作流内完成/);
});

Then('the public site does not expose online admin capabilities', function () {
  assert.doesNotMatch(this.readerNavigation, /href: '\/admin\/?'/);
  assert.doesNotMatch(this.authoringPage, /href="\/admin|<form|type="password"|contenteditable|name="token"/);
});

When('I inspect the quality gate contract', function () {
  assert.ok(this.packageJson?.scripts, 'Expected package.json scripts to be loaded.');
  this.qualityScript = this.packageJson.scripts.quality;
  this.prQualityScript = this.packageJson.scripts['quality:pr'];
  this.lintScript = this.packageJson.scripts.lint;
});

Then('the default quality gate starts with lint', function () {
  assert.equal(
    this.qualityScript,
    'pnpm lint && pnpm check && pnpm unit:gate && pnpm build && pnpm bdd'
  );
});

Then('lint fails on warnings', function () {
  assert.equal(this.lintScript, 'eslint . --max-warnings=0');
});

Then('the PR quality gate checks metadata before browser smoke', function () {
  assert.equal(this.prQualityScript, 'pnpm pr:metadata && pnpm quality && pnpm browser:smoke');
});
