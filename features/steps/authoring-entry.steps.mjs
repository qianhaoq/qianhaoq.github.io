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

Then('the public reader navigation stays separate from authoring tools', function () {
  assert.doesNotMatch(this.readerNavigation, /\/admin|\/author|写作后台|作者入口/);
});

When('I inspect the quality gate contract', function () {
  assert.ok(this.packageJson?.scripts, 'Expected package.json scripts to be loaded.');
  this.qualityScript = this.packageJson.scripts.quality;
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
