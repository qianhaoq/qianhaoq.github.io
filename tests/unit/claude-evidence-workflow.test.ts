import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflow = () => readFileSync('.github/workflows/claude-review-evidence.yml', 'utf8');

describe('manual Claude evidence workflow contract', () => {
  it('runs only by manual dispatch with explicit PR and head inputs', () => {
    const content = workflow();

    expect(content).toContain('workflow_dispatch:');
    expect(content).toContain('pr_number:');
    expect(content).toContain('head_sha:');
    expect(content).toContain('pull-requests: write');
    expect(content).not.toContain('pull_request:');
    expect(content).not.toContain('pull_request_target:');
  });

  it('posts AI Review Gate compatible Claude evidence for the requested head', () => {
    const content = workflow();

    expect(content).toContain('actual_head="$(');
    expect(content).toContain('gh pr diff "${PR_NUMBER}" --repo "${REPOSITORY}"');
    expect(content).toContain('claude-pr-review-context.md');
    expect(content).toContain('github_token: ${{ github.token }}');
    expect(content).toContain('uses: anthropics/claude-code-action@v1');
    expect(content).toContain('uses: actions/create-github-app-token@v3');
    expect(content).toContain('reviewed_head="$(jq -r');
    expect(content).toContain('Head SHA: ${HEAD_SHA}');
    expect(content).toContain('Verdict: ${verdict}');
    expect(content).toContain('gh pr comment "${PR_NUMBER}" --body-file "${comment_file}"');
  });
});
