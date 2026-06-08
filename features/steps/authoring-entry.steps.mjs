import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

Given('本地作者入口可用', function () {
  assert.ok(existsSync('AUTHORING.md'), 'Expected AUTHORING.md to document the writer entry.');

  this.packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(this.packageJson.scripts.author, 'tsx scripts/author.ts');
  assert.equal(this.packageJson.scripts['author:workbench'], 'tsx scripts/author-workbench.ts');
  assert.equal(this.packageJson.scripts.write, 'tsx scripts/write-post.ts');
});

When('我检查作者契约', function () {
  this.authoringGuide = readFileSync('AUTHORING.md', 'utf8');
  this.readerNavigation = readFileSync('src/lib/site.ts', 'utf8');
  this.authoringPage = readFileSync('dist/authoring/index.html', 'utf8');
  this.dryRunDraft = JSON.parse(execFileSync(
    'pnpm',
    ['--silent', 'write', 'BDD Authoring Draft', '--dry-run', '--date', '2026-06-06'],
    { encoding: 'utf8' }
  ));
});

Then('作者可以用一条命令开始草稿', function () {
  assert.match(this.authoringGuide, /pnpm write "文章标题"/);
  assert.equal(this.dryRunDraft.relativePath, 'src/content/posts/2026-06-06-bdd-authoring-draft.mdx');
});

Then('新文章默认是私有草稿', function () {
  assert.equal(this.dryRunDraft.draft, true);
  assert.match(this.dryRunDraft.body, /draft: true/);
});

Then('公开读者导航暴露写作指南', function () {
  assert.match(this.readerNavigation, /href: '\/authoring\/'/);
  assert.match(this.readerNavigation, /label: '写作指南'/);
});

Then('写作指南指向本地 HTML 工作台', function () {
  assert.match(this.authoringGuide, /pnpm author:workbench/);
  assert.match(this.authoringGuide, /tools\/author-workbench\.html/);
  assert.match(this.authoringPage, /pnpm author:workbench/);
});

Then('写作指南把编辑保留在本地工作流', function () {
  assert.match(this.authoringGuide, /公开站点导航里可以提供“写作指南”入口/);
  assert.match(this.authoringPage, /pnpm write "文章标题"/);
  assert.match(this.authoringPage, /本地仓库命令、PR 与 GitHub 权限边界内完成/);
});

Then('公开站点不暴露在线后台能力', function () {
  assert.doesNotMatch(this.readerNavigation, /href: '\/admin\/?'/);
  assert.doesNotMatch(this.authoringPage, /href="\/admin|<form|type="password"|contenteditable|name="token"/);
});

When('我检查质量门禁契约', function () {
  assert.ok(this.packageJson?.scripts, 'Expected package.json scripts to be loaded.');
  this.qualityScript = this.packageJson.scripts.quality;
  this.prQualityScript = this.packageJson.scripts['quality:pr'];
  this.lintScript = this.packageJson.scripts.lint;
});

Then('默认质量门禁以 lint 开头', function () {
  assert.equal(
    this.qualityScript,
    'pnpm lint && pnpm check && pnpm unit:gate && pnpm build && pnpm bdd'
  );
});

Then('lint 遇到警告即失败', function () {
  assert.equal(this.lintScript, 'eslint . --max-warnings=0');
});

Then('PR 质量门禁在浏览器冒烟前先检查元数据', function () {
  assert.equal(this.prQualityScript, 'pnpm pr:metadata && pnpm quality && pnpm browser:smoke');
});


When('我检查本地作者工作台', function () {
  this.workbench = readFileSync('tools/author-workbench.html', 'utf8');
  this.authorWorkbenchScript = readFileSync('scripts/author-workbench.ts', 'utf8');
  this.deployWorkflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
});

Then('工作台暴露所有文章 schema 字段和校验状态', function () {
  for (const field of ['title', 'description', 'pubDate', 'updatedDate', 'tags', 'draft', 'hero', 'series', 'linearIssue', 'body']) {
    assert.match(this.workbench, new RegExp(`id="${field}"`));
  }
  assert.match(this.workbench, /校验状态/);
  assert.match(this.workbench, /validate\(\)/);
});

Then('工作台在页面内预览编辑结果', function () {
  assert.match(this.workbench, /最终展示效果预览/);
  assert.match(this.workbench, /renderPreview/);
  assert.match(this.workbench, /renderMarkdown/);
});

Then('工作台通过现有部署流程准备发布 PR', function () {
  assert.match(this.workbench, /准备发布 PR/);
  assert.match(this.workbench, /pnpm quality/);
  assert.match(this.workbench, /Linear issue key/);
  assert.match(this.workbench, /gh pr create --title/);
  assert.match(this.workbench, /linearIssueKey/);
  assert.match(this.workbench, /\.github\/workflows\/deploy\.yml/);
  assert.match(this.deployWorkflow, /branches: \[main\]/);
  assert.match(this.deployWorkflow, /actions\/deploy-pages/);
  assert.match(this.authorWorkbenchScript, /tools', 'author-workbench\.html/);
});

Then('工作台给出可操作的重试反馈且不存储 token', function () {
  assert.match(this.workbench, /修正后点击“准备发布 PR”重试/);
  assert.match(this.workbench, /不在公开站点绕过 review 直接上线|不会绕过 PR review/);
  assert.doesNotMatch(this.workbench, /name="token"|type="password"|localStorage\.setItem\(['"]token/);
});
