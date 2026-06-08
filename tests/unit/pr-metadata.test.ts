import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  extractFencedBlock,
  extractMarkdownSection,
  findLinearIssueKeys,
  hasBddEvidence,
  hasLinearIssueKey,
  hasMeaningfulAcceptance,
  readPullRequestMetadataFromGitHubCli,
  validatePrMetadata
} from '../../scripts/check-pr-metadata.mjs';

const validBody = `## Linear

- Issue: ONE-16
- Project: AI-native qianhaoq.github.io 研发工作流

## Summary

- Harden PR metadata checks.

## Acceptance

- PRs without a Linear issue key fail the Quality Gate before merge.
- PRs with placeholder acceptance criteria fail the Quality Gate.

## BDD / Tests

- [x] 同步 features/site-pages.feature 与 step definitions

验证结果：

\`\`\`text
pnpm quality ✅ lint/check/unit:gate/build/bdd
8 scenarios (8 passed) / 50 tests passed
\`\`\``;

describe('PR metadata gate contracts', () => {
  it('extracts markdown sections by heading', () => {
    expect(extractMarkdownSection(validBody, 'Acceptance')).toContain('placeholder acceptance');
    expect(extractMarkdownSection(validBody, 'Missing')).toBe('');
  });

  it('accepts PR metadata with a Linear key and real acceptance criteria', () => {
    expect(hasLinearIssueKey({ title: 'ONE-16 Harden workflow gate', body: validBody })).toBe(true);
    expect(findLinearIssueKeys({ title: 'ONE-16 Harden workflow gate', body: validBody })).toContain('ONE-16');
    expect(hasMeaningfulAcceptance(validBody)).toBe(true);
    expect(validatePrMetadata({ title: 'ONE-16 Harden workflow gate', body: validBody })).toMatchObject({
      passed: true,
      errors: []
    });
  });

  it('rejects the default Linear issue placeholder', () => {
    const result = validatePrMetadata({
      title: 'Harden workflow gate',
      body: validBody.replace('ONE-16', 'ONE-')
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('PR title or body must include a Linear issue key such as ONE-15.');
  });

  it('rejects placeholder acceptance criteria', () => {
    const result = validatePrMetadata({
      title: 'ONE-16 Harden workflow gate',
      body: validBody.replace(/- PRs without[\s\S]*?Quality Gate\./, '-')
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('PR body must include a non-placeholder ## Acceptance section.');
  });

  it('rejects acceptance sections with any remaining template placeholder', () => {
    const result = validatePrMetadata({
      title: 'ONE-16 Harden workflow gate',
      body: `## Acceptance

- PR metadata gate rejects missing issue keys.
- <ACCEPTANCE-CRITERION-2>`
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('PR body must include a non-placeholder ## Acceptance section.');
  });

  it('accepts quality gate failure wording as real acceptance criteria', () => {
    expect(hasMeaningfulAcceptance(`## Acceptance

- Quality Gate fails when PR metadata does not include a Linear issue key.`)).toBe(true);
  });

  it('accepts HTML-like acceptance criteria that are not template placeholders', () => {
    expect(hasMeaningfulAcceptance(`## Acceptance

- Published pages include <meta name="description"> tags.`)).toBe(true);
  });

  it('rejects empty acceptance bullets even when another criterion is real', () => {
    const result = validatePrMetadata({
      title: 'ONE-16 Harden workflow gate',
      body: `## Acceptance

-
- PR metadata gate rejects missing issue keys.`
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('PR body must include a non-placeholder ## Acceptance section.');
  });

  it('does not blacklist future ONE issue numbers', () => {
    expect(validatePrMetadata({
      title: 'ONE-123 Harden workflow gate',
      body: `## Acceptance

- PR metadata gate accepts future real Linear issue keys.

## BDD / Tests

验证结果：

\`\`\`text
pnpm bdd ✅ 8 scenarios passed
\`\`\``
    })).toMatchObject({
      passed: true,
      errors: []
    });
  });

  it('reads local PR metadata from the GitHub CLI when available', () => {
    const execFile = (() => JSON.stringify({
      title: 'ONE-16 Harden workflow gate',
      body: '## Acceptance\n\n- PR metadata gate reads local pull request metadata.'
    })) as unknown as typeof import('node:child_process').execFileSync;

    expect(readPullRequestMetadataFromGitHubCli(execFile)).toEqual({
      title: 'ONE-16 Harden workflow gate',
      body: '## Acceptance\n\n- PR metadata gate reads local pull request metadata.'
    });
  });

  it('falls back to empty local PR metadata when GitHub CLI lookup fails', () => {
    const execFile = (() => {
      throw new Error('no pull request found');
    }) as unknown as typeof import('node:child_process').execFileSync;

    expect(readPullRequestMetadataFromGitHubCli(execFile)).toEqual({ title: '', body: '' });
  });

  it('rejects the unchanged pull request template', () => {
    const template = readFileSync('.github/PULL_REQUEST_TEMPLATE.md', 'utf8');
    const result = validatePrMetadata({
      title: 'Harden workflow gate',
      body: template
    });

    expect(result.passed).toBe(false);
    expect(result.errors).toContain('PR title or body must include a Linear issue key such as ONE-15.');
    expect(result.errors).toContain('PR body must include a non-placeholder ## Acceptance section.');
    expect(result.errors).toContain('PR body must include BDD evidence in the ## BDD / Tests section (verification output or a features/** change), or an explicit no-BDD reason such as "无需 BDD：原因".');
  });

  describe('BDD evidence gate', () => {
    const withBdd = (bddSection: string) => `## Linear

- Issue: ONE-31

## Acceptance

- Every PR must carry BDD evidence or an explicit waiver.

${bddSection}`;

    it('extracts the fenced verification block from a section', () => {
      const section = extractMarkdownSection(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\npnpm bdd ✅\n```'), 'BDD / Tests');
      expect(extractFencedBlock(section)).toBe('pnpm bdd ✅');
    });

    it('rejects an empty verification block', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\n\n```'))).toBe(false);
    });

    it('rejects a PR body without a BDD / Tests section', () => {
      expect(hasBddEvidence('## Acceptance\n\n- No BDD section at all.')).toBe(false);
    });

    it('accepts a filled verification block as evidence', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\npnpm quality ✅\n8 scenarios (8 passed)\n```'))).toBe(true);
    });

    it('rejects a bare command name that claims no successful run', () => {
      // Regression: command tokens alone (especially negated) must not satisfy the gate.
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\npnpm quality 未运行，待 CI 验证\n```'))).toBe(false);
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\ndo not run pnpm bdd\n```'))).toBe(false);
    });

    it('rejects a generic non-BDD test count as BDD evidence', () => {
      // "Tests 51 passed" is unit/browser output, not proof the BDD suite ran.
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\npnpm unit\nTests 51 passed\n```'))).toBe(false);
    });

    it('accepts a short but genuine no-BDD waiver reason', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n- 无需 BDD：纯文档'))).toBe(true);
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n- No BDD needed: typo'))).toBe(true);
    });

    it('accepts evidence in a later fence when the template block stays empty', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\n\n```\n\n```text\npnpm bdd ✅ 8 scenarios passed\n```'))).toBe(true);
    });

    it('rejects a fenced block with filler text that is not real verification', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\nnot run yet\n```'))).toBe(false);
    });

    it('rejects loose keywords that any prose could contain', () => {
      // Regression: the evidence pattern must not be satisfied by generic words like
      // "passed" / "通过" / a bare "features/" path fragment.
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\nall checks passed\n```'))).toBe(false);
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\n请通过以下方式验证\n```'))).toBe(false);
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n验证结果：\n\n```text\nsee features/ for details\n```'))).toBe(false);
    });

    it('accepts concrete verification artifacts', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n```text\n8 个场景全部通过\n```'))).toBe(true);
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n```text\nUpdated features/site-pages.feature\n```'))).toBe(true);
    });

    it('accepts an explicit Chinese no-BDD waiver with a reason', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n- 无需 BDD：仅调整内部脚本注释，无用户可见行为变化'))).toBe(true);
    });

    it('accepts an explicit English no-BDD waiver with a reason', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n- No BDD needed: docs-only typo fix, no user-visible behavior'))).toBe(true);
    });

    it('rejects a placeholder waiver without a real reason', () => {
      expect(hasBddEvidence(withBdd('## BDD / Tests\n\n- 无需 BDD：todo'))).toBe(false);
    });

    it('fails validation when BDD evidence is missing but other metadata is valid', () => {
      const result = validatePrMetadata({
        title: 'ONE-31 add coverage',
        body: '## Acceptance\n\n- Adds discovery BDD scenarios for static pages.'
      });
      expect(result.passed).toBe(false);
      expect(result.errors).toContain('PR body must include BDD evidence in the ## BDD / Tests section (verification output or a features/** change), or an explicit no-BDD reason such as "无需 BDD：原因".');
    });
  });
});
